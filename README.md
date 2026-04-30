<div align="center">
  <img src="https://raw.githubusercontent.com/conan2d20/character-generator/master/.github/logo.png">
</div>

# Conan 2d20 Character Generator

This project is based on the character generator created by [azjerei](https://github.com/azjerei)

---

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png

---

**©2023 Conan Properties International LLC.** CONAN® and related logos, characters, names, and distinctive likenesses thereof are trademarks of Conan Properties International LLC unless otherwise noted. All Rights Reserved.

## Run With Docker

Build the image:

```bash
docker build -t conan2d20-character-generator .
```

Run the container:

```bash
docker run --rm -p 8080:80 conan2d20-character-generator
```

Open the app in your browser at:

`http://localhost:8080`

## Reuse Old Modiphius PDF As Template

If you have an exported PDF from when the old Modiphius endpoint worked, you can strip character values and keep the
fillable template.

Place your sample PDF at:

`samples/original-modiphius-export.pdf`

List all PDF form fields:

```bash
npm run pdf:fields
```

Generate a stripped reusable template and field inventory:

```bash
npm run pdf:template
```

Outputs:

- `samples/original-modiphius-template.pdf`
- `samples/original-modiphius-fields.json`

## Run With Docker Compose

Start:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Open the app in your browser at:

`http://localhost:8080`
