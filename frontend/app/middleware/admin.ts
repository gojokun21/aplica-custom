export default defineNuxtRouteMiddleware((to) => {
  const accessToken = useCookie<string | null>('access_token');
  const { user } = useAuth();
  if (!accessToken.value && !user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
  if (user.value && user.value.role !== 'ADMIN') {
    return navigateTo('/dashboard');
  }
});
