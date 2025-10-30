import { ChakraProvider } from "@chakra-ui/react";
import { type AppType } from "next/dist/shared/lib/utils";
import { Navbar } from "~/components/Layout/Navbar";
import { Sidebar } from "~/components/Layout/Sidebar";
import 'primereact/resources/themes/saga-blue/theme.css';  // Elige el tema que prefieras
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';


import "~/styles/globals.css";


const MyApp: AppType = ({ Component, pageProps }) => {
  return (
   <ChakraProvider>
    <Navbar />
    {/* <Sidebar /> */}
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default MyApp;
