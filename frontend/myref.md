install packages-------------- npm install -g pnpm 2>&1 | tail -5 && pnpm --version

for moving folders ---cd "c:/Users/muska/Downloads/cfc/frontend" && mkdir -p apps packages && git mv 2>/dev/null; for d in admin consumer pro; do if [ -d "$d" ]; then mv "$d" "apps/$d"; fi; done; mkdir -p apps/admin apps/consumer apps/pro packages/ui packages/tokens packages/config packages/types packages/mocks && find . -type d | sort


generating .... pro and admin package. json .........   cd "c:/Users/muska/Downloads/cfc/frontend/apps" && for app in pro:3001 admin:3002; do
  name="${app%%:*}"; port="${app##*:}"
  sed -e "s/@cfc\/consumer/@cfc\/$name/" -e "s/--port 3000/--port $port/g" consumer/package.json > "$name/package.json"
done && echo "--- pro ---" && head -12 pro/package.json && echo "--- admin ---" && head -12 admin/package.json




writing shared config files for all three apps....
cd "c:/Users/muska/Downloads/cfc/frontend/apps" && for app in consumer pro admin; do
  mkdir -p "$app/src/app"

  cat > "$app/tsconfig.json" <<'EOF'
{
  "extends": "@cfc/config/tsconfig-next",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

  cat > "$app/tailwind.config.js" <<'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@cfc/config/tailwind-preset")],
  // packages/ui MUST be scanned or shared components ship unstyled.
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
EOF

  cat > "$app/postcss.config.js" <<'EOF'
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
EOF

  cat > "$app/.eslintrc.js" <<'EOF'
module.exports = { extends: ["@cfc/config/eslint-app"] };
EOF

  cat > "$app/next.config.js" <<'EOF'
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@cfc/ui", "@cfc/tokens", "@cfc/types", "@cfc/mocks"],
};
EOF
done && find . -maxdepth 2 -type f | sort




foundation ........which is build .......

frontend/
├── apps/
│   ├── consumer/     :3000   package.json, tsconfig, tailwind, postcss, eslint, next.config
│   ├── pro/          :3001   same
│   └── admin/        :3002   same
├── packages/
│   ├── tokens/       every colour as a CSS variable, dark block reserved
│   ├── config/       tailwind preset (v3), eslint rules, tsconfig bases
│   ├── types/        primitives.ts — Paise, BasisPoints, Role, ApiError, Page<T>
│   ├── ui/           (empty)
│   └── mocks/        (empty)
├── .gitignore
├── package.json      turbo scripts, per-app dev filters
├── pnpm-workspace.yaml
└── turbo.json




** writing the ts config for the three source packages.......

cd "c:/Users/muska/Downloads/cfc/frontend" && for p in ui types mocks; do cat > "packages/$p/tsconfig.json" <<'EOF'
{
  "extends": "@cfc/config/tsconfig-base",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
EOF
done && echo done









** install all workspace dependencies
cd "c:/Users/muska/Downloads/cfc/frontend" && pnpm install 2>&1 | tail -30




