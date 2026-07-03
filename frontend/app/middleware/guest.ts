export default defineNuxtRouteMiddleware(() => {
  const accessToken = useCookie<string | null>('access_token');
  const { isLoggedIn } = useAuth();
  if (accessToken.value || isLoggedIn.value) {
    return navigateTo('/dashboard');
  }
});
