// Populează starea utilizatorului la încărcare, dacă există un token salvat.
export default defineNuxtPlugin(async () => {
  const accessToken = useCookie<string | null>('access_token');
  if (!accessToken.value) return;
  const { fetchMe } = useAuth();
  await fetchMe();
});
