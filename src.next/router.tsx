import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { queryClient } from "./integrations/tanstack-query/root-provider";
// import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import { Provider } from "./providers";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  // const rqContext = TanstackQuery.getContext();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <Provider>
          {/*<TanstackQuery.Provider {...rqContext}>*/}
          {props.children}
          {/*</TanstackQuery.Provider>*/}
        </Provider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: queryClient,
  });

  return router;
};
