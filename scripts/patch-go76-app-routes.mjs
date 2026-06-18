import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2] || "src/App.tsx";
let source = readFileSync(target, "utf8");

function insertAfter(anchor, addition) {
  if (source.includes(addition.trim())) return;
  if (!source.includes(anchor)) {
    throw new Error(`GO76 route anchor not found: ${anchor}`);
  }
  source = source.replace(anchor, `${anchor}${addition}`);
}

insertAfter(
  '            <Route path="/guides" element={<Navigate to="/fr/guides" replace />} />',
  `
            <Route path="/selector" element={<Navigate to="/fr/selector" replace />} />
            <Route path="/diagnostic" element={<Navigate to="/fr/selector" replace />} />
            <Route path="/audit" element={<Navigate to="/fr/selector" replace />} />`
);

insertAfter(
  '              <Route path="selector" element={<SelectorPage />} />',
  `
              <Route path="diagnostic" element={<RedirectLegacyDiagnostic />} />
              <Route path="audit" element={<RedirectLegacyDiagnostic />} />`
);

insertAfter(
  `function RedirectToolToFr() {
  const { slug } = useParams();
  return <Navigate to={\`/fr/tool/\${slug}\`} replace />;
}
`,
  `
function RedirectLegacyDiagnostic() {
  const { lang } = useParams();
  return <Navigate to={\`/\${lang === "en" ? "en" : "fr"}/selector\`} replace />;
}
`
);

writeFileSync(target, source);
console.log(`GO76 routes patched in ${target}.`);
