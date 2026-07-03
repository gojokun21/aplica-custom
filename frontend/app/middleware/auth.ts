export default defineNuxtRouteMiddleware((to) => {
  const accessToken = useCookie<string | null>('access_token');
  const { isLoggedIn } = useAuth();
  if (!accessToken.value && !isLoggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
