import { ChakraProvider, Box } from "@chakra-ui/react";
import { type AppType } from "next/dist/shared/lib/utils";
import { Navbar } from "~/components/Layout/Navbar";
import 'primereact/resources/themes/saga-blue/theme.css';  // Elige el tema que prefieras
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';


import "~/styles/globals.css";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { authToken } from "~/services/api";


const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const hideNavbar = router.pathname === '/login';
  useEffect(() => {
    const guard = (nextUrl?: string) => {
      const token = authToken.get();
      const target = nextUrl ?? router.pathname;
      const goingToLogin = target === '/login' || target?.startsWith('/login');

      // Si no hay token y no está yendo al login, redirigir al login
      if (!token && !goingToLogin) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        router.replace('/login');
        return;
      }
      // Si hay token y está yendo al login, redirigir al home
      if (token && goingToLogin) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        router.replace('/');
      }
    };
    // Primera carga
    guard();
    const onRouteStart = (url: string) => guard(url);
    router.events.on('routeChangeStart', onRouteStart);
    return () => { router.events.off('routeChangeStart', onRouteStart); };
  }, [router]);
  return (
    <ChakraProvider>
      {!hideNavbar && <Navbar />}
      <Box pt={hideNavbar ? 0 : 16}>
        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
};

export default MyApp;
