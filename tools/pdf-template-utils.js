#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function loadPdfLib() {
  try {
    return require('pdf-lib');
  } catch (_err) {
    console.error('Missing dependency: pdf-lib');
    console.error('Run: npm install pdf-lib');
    process.exit(1);
  }
}

function usage() {
  console.log('Usage:');
  console.log('  node tools/pdf-template-utils.js list-fields <input.pdf> [fields.json]');
  console.log('  node tools/pdf-template-utils.js strip-values <input.pdf> <output.pdf> [fields.json]');
}

async function listFields(inputPath, jsonPath) {
  const { PDFDocument } = await loadPdfLib();
  const bytes = fs.readFileSync(inputPath);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = pdf.getForm();

  const fields = form.getFields().map((f) => {
    const type = f.constructor && f.constructor.name ? f.constructor.name : 'Unknown';
    let value = '';

    try {
      if (typeof f.getText === 'function') {
        value = f.getText() || '';
      } else if (typeof f.getOptions === 'function' && typeof f.getSelected === 'function') {
        value = (f.getSelected() || []).join(', ');
      }
    } catch (_e) {
      value = '';
    }

    return {
      name: f.getName(),
      type,
      value,
    };
  });

  fields.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Field count: ${fields.length}`);
  fields.forEach((f) => {
    const suffix = f.value ? ` = ${JSON.stringify(f.value)}` : '';
    console.log(`- ${f.name} [${f.type}]${suffix}`);
  });

  if (jsonPath) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(fields, null, 2)}\n`);
    console.log(`\nWrote field inventory: ${jsonPath}`);
  }
}

async function stripValues(inputPath, outputPath, jsonPath) {
  const { PDFDocument } = await loadPdfLib();
  const bytes = fs.readFileSync(inputPath);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = pdf.getForm();

  const fields = form.getFields();
  const inventory = [];

  fields.forEach((f) => {
    const type = f.constructor && f.constructor.name ? f.constructor.name : 'Unknown';
    const name = f.getName();
    inventory.push({ name, type });

    try {
      if (typeof f.setText === 'function') {
        f.setText('');
      } else if (typeof f.clear === 'function') {
        f.clear();
      }
    } catch (_e) {
      // Continue even if a specific field cannot be reset.
    }
  });

  // Keep form editable so it can be reused as a template.
  const outputBytes = await pdf.save({ updateFieldAppearances: true });
  fs.writeFileSync(outputPath, outputBytes);

  inventory.sort((a, b) => a.name.localeCompare(b.name));
  if (jsonPath) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`);
  }

  console.log(`Wrote stripped template: ${outputPath}`);
  if (jsonPath) {
    console.log(`Wrote field inventory: ${jsonPath}`);
  }
}

async function main() {
  const [, , command, arg1, arg2, arg3] = process.argv;

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === 'list-fields') {
    if (!arg1) {
      usage();
      process.exit(1);
    }
    await listFields(path.resolve(arg1), arg2 ? path.resolve(arg2) : undefined);
    return;
  }

  if (command === 'strip-values') {
    if (!arg1 || !arg2) {
      usage();
      process.exit(1);
    }
    await stripValues(path.resolve(arg1), path.resolve(arg2), arg3 ? path.resolve(arg3) : undefined);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
