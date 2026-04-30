import { character } from '../common/character';
import { ArchetypesHelper } from './archetypes';
import { CastesHelper } from './castes';
import { EducationsHelper } from './educations';
import { HomelandsHelper } from './homelands';
import { NaturesHelper } from './natures';
import { SkillsHelper } from './skills';
import { TalentsHelper } from './talents';

export class PdfExporter {
  static async exportCharacterToPdf(): Promise<void> {
    try {
      const { PDFDocument } = await import('pdf-lib');

      // Load template from public folder
      const response = await fetch('./samples/original-modiphius-template.pdf');
      if (!response.ok) {
        throw new Error('Failed to load PDF template');
      }
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const form = pdf.getForm();

      // Map character data to PDF fields
      this.fillCharacterData(form);

      // Save and download
      const pdfBytes = await pdf.save();
      this.downloadPdf(pdfBytes);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(`PDF export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private static fillCharacterData(form: any): void {
    // Basic character info
    this.setField(form, 'Name', character.name || '');
    this.setField(form, 'Archetype', character.archetype >= 0 ? ArchetypesHelper.getArchetype(character.archetype).name : '');
    this.setField(form, 'Caste', character.caste >= 0 ? CastesHelper.getCaste(character.caste).name : '');
    this.setField(form, 'Homeland', character.homeland >= 0 ? HomelandsHelper.getHomeland(character.homeland).name : '');
    this.setField(form, 'Nature', character.nature >= 0 ? NaturesHelper.getNature(character.nature).name : '');
    this.setField(form, 'Education', character.education >= 0 ? EducationsHelper.getEducation(character.education).name : '');
    this.setField(form, 'Trait', character.trait || '');

    // Gender and age
    this.setField(form, 'Gender - Age', `${character.gender === 0 ? 'Male' : 'Female'}, ${character.age}`);
    this.setField(form, 'Apperance', character.appearance || '');
    this.setField(form, 'Personality', character.personality || '');

    // Attributes (each has a .Value field and multiple skills)
    const attributeNames = ['Agility', 'Awareness', 'Brawn', 'Coordination', 'Intelligence', 'Personality', 'Willpower'];
    attributeNames.forEach((attrName, attrIdx) => {
      const attr = character.attributes[attrIdx];
      this.setField(form, `${attrName}.Value`, attr.value.toString());

      // Fill skills for this attribute
      const skillsForAttr = SkillsHelper.getSkillsForAttribute(attrIdx);
      skillsForAttr.forEach((skillIdx, skillPos) => {
        const skill = character.skills[skillIdx];
        if (skill) {
          // Skill row pattern: [expertise, focus, total]
          this.setField(form, `${attrName}.Skill.${skillPos}.0`, skill.expertise.toString());
          this.setField(form, `${attrName}.Skill.${skillPos}.1`, skill.focus.toString());
          // Field .2 is likely calculated total, skip it
        }
      });
    });

    // Talents
    let talentIdx = 0;
    for (const talentName in character.talents) {
      if (talentIdx < 25) {
        // Assuming max ~25 talent slots in PDF
        const talent = character.talents[talentName];
        this.setField(form, `Talent.Name.${talentIdx}`, talentName);
        if (talent.rank > 1) {
          this.setField(form, `Talent.Rank.${talentIdx}`, talent.rank.toString());
        }
        talentIdx++;
      }
    }

    // Languages
    const languagesStr = character.languages.join(',');
    this.setField(form, 'Languages', languagesStr);

    // Equipment/Belongings (try to fill first few slots)
    character.equipment.forEach((eq, idx) => {
      if (idx < 22) {
        // Belongings.0.x and Belongings.1.x patterns observed
        const section = Math.floor(idx / 11);
        const slot = idx % 11;
        this.setField(form, `Belongings.${section}.${slot}`, eq);
      }
    });

    // Weapons (try to fill weapon slots)
    // Assuming Weapon.N.* pattern for up to 7 weapons
    const equippedWeapons = character.equipment.filter(
      (eq) => SkillsHelper.getSkillName(7) === 'Melee' || SkillsHelper.getSkillName(8) === 'Ranged'
    );

    // Courage, Gold, Standing, Vigor, Resolve (tracked via checkboxes and text)
    this.setField(form, 'Courage', character.resolve.toString());
    this.setField(form, 'Gold', character.gold.toString());
    this.setField(form, 'Standing', character.socialStanding.toString());

    // Fortune Points and Vigor/Resolve checkboxes (bit flags in character object)
    for (let i = 0; i < character.fortunePoints && i < 5; i++) {
      this.setCheckbox(form, `FP.${i}`, true);
    }

    // Spells
    character.spells.forEach((spell, idx) => {
      if (idx < 40) {
        // Estimate ~8 spell groups with 5 slots each
        const group = Math.floor(idx / 5);
        const slot = idx % 5;
        this.setField(form, `Spell.${group}.${slot}`, spell);
      }
    });

    // Story and War Story
    this.setField(form, 'War Story', character.warStory || '');
  }

  private static setField(form: any, fieldName: string, value: string): void {
    try {
      const field = form.getField(fieldName);
      if (field && typeof field.setText === 'function') {
        field.setText(value);
      }
    } catch (_err) {
      // Field may not exist, continue silently
    }
  }

  private static setCheckbox(form: any, fieldName: string, checked: boolean): void {
    try {
      const field = form.getField(fieldName);
      if (field) {
        if (checked && typeof field.check === 'function') {
          field.check();
        } else if (!checked && typeof field.uncheck === 'function') {
          field.uncheck();
        }
      }
    } catch (_err) {
      // Field may not exist, continue silently
    }
  }

  private static downloadPdf(pdfBytes: Uint8Array): void {
    const safeName = character.name
      ? character.name
          .trim()
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-+|-+$/g, '')
      : 'conan-character';

    const fileName = `${safeName || 'conan-character'}-sheet.pdf`;

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
