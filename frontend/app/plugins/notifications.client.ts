// Inițializează notificările (fetch + listeneri socket) când există o sesiune.
export default defineNuxtPlugin(async () => {
  const accessToken = useCookie<string | null>('access_token');
  if (!accessToken.value) return;
  await useNotifications().init();
});
