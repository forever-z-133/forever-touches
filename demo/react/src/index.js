import VConsole from 'vconsole';
import { StrictMode } from "react";
import ReactDOM from "react-dom";

import App from "./App";

new VConsole();

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  rootElement
);
