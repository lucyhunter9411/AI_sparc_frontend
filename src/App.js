import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useRoutes } from "react-router-dom";
import ChatUI from "./pages/client/mainWindow";
import AdminPage from "./pages/admin/admin";
import SelectLecture from "./pages/SelectLecture";
// Create default theme
const theme = createTheme();

function App() {
  // Define routes using useRoutes
  let routes = useRoutes([
    {
      path: "/",
      element: <ChatUI />,
    },
    {
      path: "/admin",
      element: <AdminPage />,
    },
    {
      path: "/test-with-client",
      element: <SelectLecture />,
    },
  ]);

  // Return the routes inside the ThemeProvider
  return <ThemeProvider theme={theme}>{routes}</ThemeProvider>;
}

export default App;
