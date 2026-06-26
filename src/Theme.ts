import { createTheme } from "@mui/material/styles";

export const createAppTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#1b6fbd" : "#70b7ff",
      },
      secondary: {
        main: mode === "light" ? "#6b5b95" : "#c4b5fd",
      },
      background: {
        default: mode === "light" ? "#f7f8fa" : "#111316",
        paper: mode === "light" ? "#ffffff" : "#191d22",
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: "inherit",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
    },
  });
