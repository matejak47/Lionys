# 1. Použijeme Node.js verze 20 (Alpine je super malá verze Linuxu)
FROM node:20-alpine

# 2. Nastavíme pracovní složku
WORKDIR /app

# 3. Zkopírujeme definice závislostí (package.json)
# Děláme to odděleně od zbytku kódu, aby Docker využil mezipaměť (cache)
COPY package*.json ./

# 4. Nainstalujeme závislosti
RUN npm install

# 5. Zkopírujeme zbytek kódu aplikace
COPY . .

# 6. Otevřeme port pro Vite (standardně 5173)
EXPOSE 5173

# 7. Spustíme vývojový server
# DŮLEŽITÉ: --host zajistí, že web bude přístupný i mimo kontejner (v prohlížeči)
CMD ["npm", "run", "dev", "--", "--host"]