import { Prism } from "prism-react-renderer";

let registered = false;

export function registerLanguages() {
  if (registered) return;
  registered = true;

  /* Make Prism available globally so prismjs grammar files can find it */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Prism = Prism;

  /* Load language grammars */
  require("prismjs/components/prism-bash");
  require("prismjs/components/prism-powershell");
  require("prismjs/components/prism-java");
  require("prismjs/components/prism-php");
  require("prismjs/components/prism-ruby");
  require("prismjs/components/prism-docker");
  require("prismjs/components/prism-nginx");
  require("prismjs/components/prism-toml");
  require("prismjs/components/prism-ini");
  require("prismjs/components/prism-perl");
  require("prismjs/components/prism-lua");
  require("prismjs/components/prism-hcl");
}
