import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import {
  clientProfiles,
  freelancerProfiles,
  freelancerSkills,
  reviews,
  skills,
  users,
  UserRole,
} from '../db/schema';
import { sanitizeRichText } from '../common/sanitize-html.util';
import { ReviewsService } from '../reviews/reviews.service';
import { QueryFreelancersDto } from './dto/query-freelancers.dto';
import { SetSkillsDto } from './dto/set-skills.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';

/** Elimină cheile `undefined` dintr-un patch de update. */
function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly reviews: ReviewsService,
  ) {}

  async getMyProfile(userId: string, role: UserRole) {
    if (role === 'FREELANCER') {
      return this.getFreelancer(userId);
    }
    if (role === 'CLIENT') {
      return this.getClient(userId);
    }
    return { role };
  }

  /* ------------------------------- Freelancer ------------------------------ */

  async getFreelancer(userId: string) {
    const profile = await this.db.query.freelancerProfiles.findFirst({
      where: eq(freelancerProfiles.userId, userId),
      with: { skills: { with: { skill: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Profil de freelancer inexistent');
    }
    return this.shapeFreelancer(profile);
  }

  async updateFreelancer(userId: string, dto: UpdateFreelancerProfileDto) {
    const patch = definedOnly(dto);
    if (typeof patch.overview === 'string') {
      patch.overview = sanitizeRichText(patch.overview);
    }
    const [updated] = await this.db
      .update(freelancerProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(freelancerProfiles.userId, userId))
      .returning();
    if (!updated) {
      throw new NotFoundException('Profil de freelancer inexistent');
    }
    return this.getFreelancer(userId);
  }

  async setSkills(userId: string, dto: SetSkillsDto) {
    const profile = await this.db.query.freelancerProfiles.findFirst({
      where: eq(freelancerProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('Profil de freelancer inexistent');
    }

    const uniqueIds = [...new Set(dto.skillIds)];
    if (uniqueIds.length > 0) {
      const found = await this.db.query.skills.findMany({
        where: inArray(skills.id, uniqueIds),
      });
      if (found.length !== uniqueIds.length) {
        throw new BadRequestException('Unele skill-uri nu există');
      }
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(freelancerSkills)
        .where(eq(freelancerSkills.freelancerProfileId, profile.id));
      if (uniqueIds.length > 0) {
        await tx.insert(freelancerSkills).values(
          uniqueIds.map((skillId) => ({
            freelancerProfileId: profile.id,
            skillId,
          })),
        );
      }
    });

    return this.getFreelancer(userId);
  }

  /** Listare + filtrare publică de freelanceri, cu paginare. */
  async listFreelancers(query: QueryFreelancersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    // Filtru pe skill (prin slug) -> lista de profile care au acel skill.
    let profileIdsForSkill: string[] | undefined;
    if (query.skill) {
      const skill = await this.db.query.skills.findFirst({
        where: eq(skills.slug, query.skill),
      });
      if (!skill) {
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }
      const links = await this.db.query.freelancerSkills.findMany({
        where: eq(freelancerSkills.skillId, skill.id),
      });
      profileIdsForSkill = links.map((l) => l.freelancerProfileId);
      if (profileIdsForSkill.length === 0) {
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    const conditions = [];
    if (profileIdsForSkill) {
      conditions.push(inArray(freelancerProfiles.id, profileIdsForSkill));
    }
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(
        or(
          ilike(freelancerProfiles.title, term),
          ilike(freelancerProfiles.overview, term),
          ilike(users.firstName, term),
          ilike(users.lastName, term),
        ),
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    // Scor de completitudine a profilului (0–6): fiecare câmp completat = 1 punct.
    const completeness = sql<number>`(
      (case when ${freelancerProfiles.title} is not null and ${freelancerProfiles.title} <> '' then 1 else 0 end)
      + (case when ${freelancerProfiles.overview} is not null and ${freelancerProfiles.overview} <> '' then 1 else 0 end)
      + (case when ${freelancerProfiles.hourlyRateCents} is not null then 1 else 0 end)
      + (case when ${users.avatarUrl} is not null and ${users.avatarUrl} <> '' then 1 else 0 end)
      + (case when ${freelancerProfiles.countryCode} is not null and ${freelancerProfiles.countryCode} <> '' then 1 else 0 end)
      + (case when exists (select 1 from ${freelancerSkills} fs where fs.freelancer_profile_id = ${freelancerProfiles.id}) then 1 else 0 end)
    )`;
    // Numărul de recenzii primite de freelancer.
    const reviewCount = sql<number>`(select count(*) from ${reviews} r where r.reviewee_id = ${users.id})`;

    const rows = await this.db
      .select({
        id: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        title: freelancerProfiles.title,
        overview: freelancerProfiles.overview,
        hourlyRateCents: freelancerProfiles.hourlyRateCents,
        countryCode: freelancerProfiles.countryCode,
        available: freelancerProfiles.available,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
      })
      .from(freelancerProfiles)
      .innerJoin(users, eq(users.id, freelancerProfiles.userId))
      .where(where)
      .orderBy(
        desc(completeness),
        desc(reviewCount),
        desc(freelancerProfiles.available),
        desc(freelancerProfiles.updatedAt),
      )
      .limit(limit)
      .offset(offset);

    const totalRes = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(freelancerProfiles)
      .innerJoin(users, eq(users.id, freelancerProfiles.userId))
      .where(where);
    const total = totalRes[0]?.count ?? 0;

    // Skill-urile pentru profilele returnate, într-un singur query (fără N+1).
    const ids = rows.map((r) => r.id);
    const skillRows = ids.length
      ? await this.db
          .select({
            profileId: freelancerSkills.freelancerProfileId,
            id: skills.id,
            name: skills.name,
            slug: skills.slug,
          })
          .from(freelancerSkills)
          .innerJoin(skills, eq(skills.id, freelancerSkills.skillId))
          .where(inArray(freelancerSkills.freelancerProfileId, ids))
      : [];

    const skillsByProfile = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const s of skillRows) {
      const list = skillsByProfile.get(s.profileId) ?? [];
      list.push({ id: s.id, name: s.name, slug: s.slug });
      skillsByProfile.set(s.profileId, list);
    }

    // Rating agregat per freelancer (batch, fără N+1).
    const ratingByUser = await this.reviews.ratingSummary(rows.map((r) => r.userId));

    const items = rows.map(({ id, firstName, lastName, avatarUrl, ...rest }) => ({
      ...rest,
      id,
      user: { id: rest.userId, firstName, lastName, avatarUrl },
      skills: skillsByProfile.get(id) ?? [],
      rating: ratingByUser.get(rest.userId) ?? { avg: 0, count: 0 },
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Vizualizare publică a unui freelancer (fără date sensibile). */
  async getPublicFreelancer(userId: string) {
    const profile = await this.db.query.freelancerProfiles.findFirst({
      where: eq(freelancerProfiles.userId, userId),
      with: {
        user: true,
        skills: { with: { skill: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Freelancer inexistent');
    }
    const shaped = this.shapeFreelancer(profile);
    const rating = (await this.reviews.ratingSummary([userId])).get(userId) ?? { avg: 0, count: 0 };
    return {
      ...shaped,
      user: {
        id: profile.user.id,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        avatarUrl: profile.user.avatarUrl,
      },
      rating,
    };
  }

  /* --------------------------------- Client -------------------------------- */

  async getClient(userId: string) {
    const profile = await this.db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, userId),
    });
    if (!profile) {
      throw new NotFoundException('Profil de client inexistent');
    }
    return profile;
  }

  async updateClient(userId: string, dto: UpdateClientProfileDto) {
    const patch = definedOnly(dto);
    if (typeof patch.description === 'string') {
      patch.description = sanitizeRichText(patch.description);
    }
    const [updated] = await this.db
      .update(clientProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(clientProfiles.userId, userId))
      .returning();
    if (!updated) {
      throw new NotFoundException('Profil de client inexistent');
    }
    return updated;
  }

  /* --------------------------------- Skills -------------------------------- */

  listSkills() {
    return this.db.query.skills.findMany({ orderBy: asc(skills.name) });
  }

  /* -------------------------------- Helpers -------------------------------- */

  private shapeFreelancer(profile: {
    skills: { skill: { id: string; name: string; slug: string } }[];
    [key: string]: unknown;
  }) {
    const { skills: skillLinks, ...rest } = profile;
    return {
      ...rest,
      skills: skillLinks.map((link) => link.skill),
    };
  }
}
