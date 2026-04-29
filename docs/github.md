# Publicar no GitHub

Quando o repositório estiver criado:

```bash
cd /Users/ronisilva/Documents/Prototipo
git init
git add .
git commit -m "Initial CARVION prototype"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Se preferir HTTPS, troque a URL do remote por:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```
