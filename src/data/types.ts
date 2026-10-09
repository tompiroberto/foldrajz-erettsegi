export type Level = 'kozep' | 'emelt';

export type RegionName =
  | 'Föld'
  | 'Afrika'
  | 'Amerika'
  | 'Ausztrália és Óceánia'
  | 'Ázsia'
  | 'Európa'
  | 'Magyarország';

/** One entry of starter-data/topography.json. */
export interface TopoItem {
  id: string;
  name: string;
  region: RegionName;
  regionNo: number;
  category: string;
  level: Level;
}

export interface TopographyFile {
  _source: string;
  levels: Record<Level, string>;
  count: number;
  items: TopoItem[];
}

/** One subtopic block of starter-data/concepts.json. */
export interface ConceptGroup {
  topicNo: number;
  subtopic: string;
  kozep: string[];
  emelt: string[];
}

export interface ConceptsFile {
  topics: Record<string, string>;
  concepts: ConceptGroup[];
  count: number;
}

/** One subtopic block of starter-data/requirements.json. */
export interface RequirementGroup {
  topicNo: number;
  subtopic: string;
  kozep: string[];
  emelt: string[];
}

export interface RequirementsFile {
  topics: Record<string, string>;
  requirements: RequirementGroup[];
}

/** A single requirement sentence after cleanup, the unit of a learning card. */
export interface Objective {
  id: string;
  topicNo: number;
  subtopic: string;
  subtopicId: string;
  level: Level;
  text: string;
}

/** A single official concept label after splitting the per-subtopic arrays. */
export interface ConceptLabel {
  id: string;
  topicNo: number;
  subtopic: string;
  level: Level;
  /** The label exactly as in concepts.json. */
  label: string;
}
