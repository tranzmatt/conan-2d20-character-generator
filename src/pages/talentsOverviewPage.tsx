import React = require('react');
import { character } from '../common/character';
import { SetHeaderText } from '../common/extensions';
import { CopyrightDisclaimer } from '../components/CopyrightDisclaimer';
import { DropDownInput } from '../components/dropDownInput';
import { CastesHelper } from '../helpers/castes';
import { HomelandsHelper } from '../helpers/homelands';
import { Skill, SkillsHelper } from '../helpers/skills';
import { Source } from '../helpers/sources';
import { ITalentPrerequisite, TalentsHelper } from '../helpers/talents';

class TalentViewModel {
  name: string;
  description: string;
  source: string;
  prerequisites: string;

  constructor(name: string, description: string, source: string, prerequisites: string) {
    this.name = name;
    this.description = description;
    this.source = source;
    this.prerequisites = prerequisites;
  }
}

interface TalentDisplayItem extends TalentViewModel {
  category: string;
}

interface TalentsOverviewState {
  searchQuery: string;
}

export class TalentsOverviewPage extends React.Component<{}, TalentsOverviewState> {
  private _categories: string[] = [];
  private _category: string = '';
  private _talents: { [category: string]: TalentViewModel[] } = {};

  constructor(props: {}) {
    super(props);

    this.state = {
      searchQuery: ''
    };

    SetHeaderText('Talents');

    this.setupSources();
    this.setupCategories();
    this.loadTalents();
  }

  private getFilteredTalents(): TalentDisplayItem[] {
    const query = this.state.searchQuery.toLowerCase().trim();

    if (!query) {
      // No search: show talents from current category
      return this._talents[this._category].map(
        (t) =>
          ({
            ...t,
            category: this._category
          } as TalentDisplayItem)
      );
    }

    // Search across all categories
    const results: TalentDisplayItem[] = [];
    for (const category of this._categories) {
      for (const talent of this._talents[category]) {
        if (talent.name.toLowerCase().includes(query)) {
          results.push({
            ...talent,
            category: category
          } as TalentDisplayItem);
        }
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  render() {
    const talents = this.getFilteredTalents().map((t, i) => {
      return (
        <tr key={i}>
          <td className="selection-header">
            {t.name}
            <div className="selection-header-small">({t.source})</div>
            {this.state.searchQuery && (
              <div className="selection-header-small" style={{ fontSize: '0.8em', marginTop: '4px' }}>
                Category: {t.category}
              </div>
            )}
          </td>
          <td>
            <div>
              <b>Prerequisites:</b> {t.prerequisites}
            </div>
            <br />
            <div>{t.description}</div>
          </td>
        </tr>
      );
    });

    const isSearching = this.state.searchQuery.length > 0;

    return (
      <div>
        <div className="float-top">
          <input
            type="text"
            placeholder="Search talents by name..."
            value={this.state.searchQuery}
            onChange={(e) => this.setState({ searchQuery: e.target.value })}
            style={{
              padding: '8px 12px',
              marginRight: '12px',
              marginBottom: '12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '250px'
            }}
          />
          <DropDownInput
            items={this._categories}
            defaultValue={this._category}
            onChange={(index) => {
              this.onCategoryChanged(index);
            }}
          />
          {isSearching && (
            <div style={{ marginLeft: '12px', color: '#666', fontSize: '14px', display: 'inline-block' }}>
              Found {talents.length} talent{talents.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="page">
          <table className="selection-list">
            <tbody>{talents}</tbody>
          </table>
          <CopyrightDisclaimer />
        </div>
      </div>
    );
  }

  private setupSources() {
    for (let source in Object.keys(Source).filter((src) => !isNaN(Number(Source[src])))) {
      let src = Number(source);
      character.addSource(src);
    }
  }

  private setupCategories() {
    var skillFilter = [25, 26, 27, 37];

    for (let sk in Object.keys(Skill).filter((skill) => !isNaN(Number(Skill[skill])))) {
      if (skillFilter.indexOf(Number(sk)) === -1) {
        let s = SkillsHelper.getSkillName(Number(sk));
        this._categories.push(s);
      }
    }

    this._categories.push('Ancient Bloodlines');
    this._categories.push('Castes');
    this._categories.push('Homelands');

    this._categories = this._categories.sort((a, b) => a.localeCompare(b));
    this._category = this._categories[0];

    for (var c = 0; c < this._categories.length; c++) {
      const category = this._categories[c];
      if (!this._talents[category]) {
        this._talents[category] = [];
      }
    }
  }

  private loadTalents() {
    for (var c = 0; c < this._categories.length; c++) {
      const category = this._categories[c];
      console.log(category);
      if (category === 'Castes') {
        const castes = CastesHelper.getCastes();
        for (var i = 0; i < castes.length; i++) {
          let caste = castes[i];
          for (var j = 0; j < caste.talents.length; j++) {
            const talent = TalentsHelper.getTalent(caste.talents[j].name);
            if (!this.hasTalent(this._talents[category], talent.name)) {
              this._talents[category].push(
                new TalentViewModel(
                  talent.name,
                  talent.description,
                  this.getSource(talent.name),
                  this.prerequisitesToString(talent.prerequisites)
                )
              );
            }
          }
        }
      } else if (category === 'Homelands') {
        const homelands = HomelandsHelper.getHomelands();
        for (var i = 0; i < homelands.length; i++) {
          let homeland = homelands[i];
          if (homeland.talent) {
            const talent = TalentsHelper.getTalent(homeland.talent.name);
            if (!this.hasTalent(this._talents[category], talent.name)) {
              this._talents[category].push(
                new TalentViewModel(
                  talent.name,
                  talent.description,
                  this.getSource(talent.name),
                  this.prerequisitesToString(talent.prerequisites)
                )
              );
            }
          }
        }

        if (!this.hasTalent(this._talents[category], 'Primitive')) {
          const tal = TalentsHelper.getTalent('Primitive');
          this._talents[category].push(
            new TalentViewModel(
              tal.name,
              tal.description,
              this.getSource(tal.name),
              this.prerequisitesToString(tal.prerequisites)
            )
          );
        }

        if (!this.hasTalent(this._talents[category], 'Uncivilized')) {
          const tal = TalentsHelper.getTalent('Uncivilized');
          this._talents[category].push(
            new TalentViewModel(
              tal.name,
              tal.description,
              this.getSource(tal.name),
              this.prerequisitesToString(tal.prerequisites)
            )
          );
        }
      } else if (category === 'Ancient Bloodlines') {
        const noneTalents = TalentsHelper.getTalents()[Skill.None];
        for (var i = 0; i < noneTalents.length; i++) {
          const talent = noneTalents[i];
          if (talent.name.indexOf('Ancient Bloodline') !== -1) {
            this._talents[category].push(
              new TalentViewModel(
                talent.name,
                talent.description,
                this.getSource(talent.name),
                this.prerequisitesToString(talent.prerequisites)
              )
            );
          }
        }
      } else {
        const talents = TalentsHelper.getTalents()[SkillsHelper.toSkill(category)];
        for (var i = 0; i < talents.length; i++) {
          const talent = talents[i];
          this._talents[category].push(
            new TalentViewModel(
              talent.name,
              talent.description,
              this.getSource(talent.name),
              this.prerequisitesToString(talent.prerequisites)
            )
          );
        }
      }

      this._talents[category].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  private hasTalent(talents: TalentViewModel[], name: string) {
    return talents.some((t) => t.name === name);
  }

  private getSource(talent: string) {
    return Source[TalentsHelper.getSourceForTalent(talent)];
  }

  private prerequisitesToString(pre: {}[]) {
    var result = [];

    for (var p in pre) {
      var prereq = pre[p] as ITalentPrerequisite;
      var s = prereq.str();
      if (s.length > 0) {
        result.push(prereq.str());
      }
    }

    return result.join(', ');
  }

  private onCategoryChanged(index: number) {
    this._category = this._categories[index];
    this.forceUpdate();
  }
}
