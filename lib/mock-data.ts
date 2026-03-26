import { User, Project, Task, ActivityEntry, Department, Priority, TaskStatus, ProjectStatus } from './types';

// Generate dates relative to today
const today = new Date();
const daysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};
const daysFromNow = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Admin co-founders
export const admins: User[] = [
  {
    id: 'admin-0',
    name: 'System Administrator',
    email: 'adminnt@gmail.com',
    password: 'dmin123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u1',
    name: 'Ayush Ranawade',
    email: 'swati@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    workload: { activeTasks: 8, completedThisWeek: 5, overdueTasks: 1, avgCompletionTime: 2.5 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(0),
  },
  {
    id: 'u2',
    name: 'Yogesh Ostwal',
    email: 'yogesh.ostwal@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    workload: { activeTasks: 12, completedThisWeek: 7, overdueTasks: 2, avgCompletionTime: 3.1 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(0),
  },
  {
    id: 'u3',
    name: 'Sunil Kapgate',
    email: 'sunilkapgate@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    workload: { activeTasks: 6, completedThisWeek: 4, overdueTasks: 0, avgCompletionTime: 1.8 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(1),
  },
];

// Team members across departments
export const members: User[] = [
  // Mol Bio Team (6 members)
  { id: 'u4', name: 'Sayali Chaske', email: 'sayali@nucleovir.com', role: 'member', department: 'Mol Bio', workload: { activeTasks: 5, completedThisWeek: 3, overdueTasks: 1, avgCompletionTime: 2.2 }, elnUrl: 'https://eln.nucleovir.com/priya', joinedDate: '2023-03-20', lastActive: daysAgo(0) },
  { id: 'u5', name: 'Rutuja', email: 'rutuja@nucleovir.com', role: 'member', department: 'Mol Bio', workload: { activeTasks: 7, completedThisWeek: 4, overdueTasks: 2, avgCompletionTime: 3.5 }, elnUrl: 'https://eln.nucleovir.com/raj', joinedDate: '2023-04-10', lastActive: daysAgo(0) },

  // AI Team (7 members)
  { id: 'u10', name: 'Apurv Kochar', email: 'apurvkochar@nucleovir.com', role: 'member', department: 'AI', workload: { activeTasks: 9, completedThisWeek: 5, overdueTasks: 2, avgCompletionTime: 2.4 }, elnUrl: 'https://eln.nucleovir.com/kavitha', joinedDate: '2023-02-15', lastActive: daysAgo(0) },
  { id: 'u11', name: 'Alok Ahirrao', email: 'Alokahirrao@nucleovir.com', role: 'member', department: 'AI', workload: { activeTasks: 4, completedThisWeek: 7, overdueTasks: 0, avgCompletionTime: 1.6 }, elnUrl: 'https://eln.nucleovir.com/arun', joinedDate: '2023-03-01', lastActive: daysAgo(0) },
  { id: 'u22', name: 'Shahebaaz Kazi', email: 'shahebaazkazi002nt@gmail.com', role: 'member', department: 'AI', workload: { activeTasks: 3, completedThisWeek: 2, overdueTasks: 0, avgCompletionTime: 1.2 }, elnUrl: 'https://eln.nucleovir.com/shahebaaz', joinedDate: '2025-03-01', lastActive: daysAgo(0) },

  // Bioinfo Team (5 members)
  { id: 'u16', name: 'Adwait Joshi', email: 'adwaitjoshi@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 4, completedThisWeek: 5, overdueTasks: 0, avgCompletionTime: 1.8 }, elnUrl: 'https://eln.nucleovir.com/amit', joinedDate: '2023-02-28', lastActive: daysAgo(0) },
  { id: 'u17', name: 'Prapti', email: 'prapti@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 6, completedThisWeek: 4, overdueTasks: 1, avgCompletionTime: 2.5 }, elnUrl: 'https://eln.nucleovir.com/sunita', joinedDate: '2023-03-15', lastActive: daysAgo(1) },
  { id: 'u18', name: 'Yashika', email: 'yashika@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 3, completedThisWeek: 8, overdueTasks: 0, avgCompletionTime: 1.4 }, elnUrl: 'https://eln.nucleovir.com/kiran', joinedDate: '2023-04-05', lastActive: daysAgo(0) },
  { id: 'u19', name: 'Khushi', email: 'khushi@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 5, completedThisWeek: 3, overdueTasks: 2, avgCompletionTime: 3.2 }, elnUrl: 'https://eln.nucleovir.com/pooja', joinedDate: '2023-05-10', lastActive: daysAgo(0) },
  { id: 'u20', name: 'Darshana', email: 'darshana@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 7, completedThisWeek: 4, overdueTasks: 1, avgCompletionTime: 2.7 }, elnUrl: 'https://eln.nucleovir.com/venkat', joinedDate: '2023-06-20', lastActive: daysAgo(2) },
  { id: 'u21', name: 'Aruna', email: 'aruna@nucleovir.com', role: 'member', department: 'Bioinfo', workload: { activeTasks: 7, completedThisWeek: 4, overdueTasks: 1, avgCompletionTime: 2.7 }, elnUrl: 'https://eln.nucleovir.com/venkat', joinedDate: '2023-06-20', lastActive: daysAgo(2) },
];

export const allUsers: User[] = [...admins, ...members];

// Projects
export const projects: Project[] = [
  {
    id: 'p1',
    name: 'AAV Vector Optimization',
    description: 'Optimize AAV vectors for improved transduction efficiency in target cells',
    department: 'Mol Bio',
    status: 'active',
    progress: 65,
    color: '#3b82f6',
    dueDate: daysFromNow(21),
    endDate: daysFromNow(21),
    startDate: daysAgo(45),
    leadId: 'u4',
    memberIds: ['u4', 'u5', 'u6', 'u7'],
    elnLinks: [
      { userId: 'u4', url: 'https://eln.nucleovir.com/priya/aav-opt' },
      { userId: 'u5', url: 'https://eln.nucleovir.com/raj/aav-vectors' },
    ],
    comments: [
      { id: 'c1', userId: 'u1', content: 'Great progress on the capsid modifications. Keep pushing!', createdAt: daysAgo(2), isLeadershipNote: false },
    ],
    milestones: [
      { id: 'm1', title: 'Initial vector design', dueDate: daysAgo(30), completed: true },
      { id: 'm2', title: 'In-vitro validation', dueDate: daysAgo(7), completed: true },
      { id: 'm3', title: 'Scale-up production', dueDate: daysFromNow(14), completed: false },
    ],
    tags: ['gene-therapy', 'aav', 'vectors'],
    priority: 'high',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: 'p2',
    name: 'ML Drug Target Prediction',
    description: 'Develop ML models to predict novel drug targets from genomic data',
    department: 'AI',
    status: 'active',
    progress: 40,
    color: '#8b5cf6',
    dueDate: daysFromNow(45),
    endDate: daysFromNow(45),
    startDate: daysAgo(30),
    leadId: 'u10',
    memberIds: ['u10', 'u11', 'u12', 'u13'],
    elnLinks: [
      { userId: 'u10', url: 'https://eln.nucleovir.com/kavitha/ml-targets' },
      { userId: 'u11', url: 'https://eln.nucleovir.com/arun/prediction-models' },
    ],
    comments: [],
    milestones: [
      { id: 'm4', title: 'Data pipeline setup', dueDate: daysAgo(14), completed: true },
      { id: 'm5', title: 'Model training v1', dueDate: daysFromNow(7), completed: false },
      { id: 'm6', title: 'Validation & benchmarks', dueDate: daysFromNow(30), completed: false },
    ],
    tags: ['ml', 'drug-discovery', 'genomics'],
    priority: 'critical',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(0),
  },
  {
    id: 'p3',
    name: 'Variant Calling Pipeline',
    description: 'Build automated variant calling pipeline for clinical samples',
    department: 'Bioinfo',
    status: 'at-risk',
    progress: 25,
    color: '#10b981',
    dueDate: daysFromNow(7),
    endDate: daysFromNow(7),
    startDate: daysAgo(60),
    leadId: 'u16',
    memberIds: ['u16', 'u17', 'u18'],
    elnLinks: [
      { userId: 'u16', url: 'https://eln.nucleovir.com/amit/variant-pipeline' },
    ],
    comments: [
      { id: 'c2', userId: 'u2', content: 'This is falling behind. Need daily standups until back on track.', createdAt: daysAgo(1), isLeadershipNote: true },
    ],
    milestones: [
      { id: 'm7', title: 'Pipeline architecture', dueDate: daysAgo(45), completed: true },
      { id: 'm8', title: 'Core implementation', dueDate: daysAgo(14), completed: false },
      { id: 'm9', title: 'Testing & validation', dueDate: daysFromNow(5), completed: false },
    ],
    tags: ['pipeline', 'clinical', 'variants'],
    priority: 'critical',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(0),
  },
  {
    id: 'p4',
    name: 'CRISPR Screen Analysis',
    description: 'Analyze CRISPR screen results for therapeutic target identification',
    department: 'Mol Bio',
    status: 'active',
    progress: 80,
    color: '#3b82f6',
    dueDate: daysFromNow(10),
    endDate: daysFromNow(10),
    startDate: daysAgo(35),
    leadId: 'u8',
    memberIds: ['u8', 'u9'],
    elnLinks: [
      { userId: 'u8', url: 'https://eln.nucleovir.com/meera/crispr-screens' },
    ],
    comments: [],
    milestones: [
      { id: 'm10', title: 'Data processing', dueDate: daysAgo(21), completed: true },
      { id: 'm11', title: 'Hit identification', dueDate: daysAgo(7), completed: true },
      { id: 'm12', title: 'Validation experiments', dueDate: daysFromNow(7), completed: false },
    ],
    tags: ['crispr', 'screens', 'target-id'],
    priority: 'high',
    createdAt: daysAgo(35),
    updatedAt: daysAgo(2),
  },
  {
    id: 'p5',
    name: 'Protein Structure Prediction',
    description: 'Implement deep learning for protein structure prediction',
    department: 'AI',
    status: 'on-hold',
    progress: 15,
    color: '#8b5cf6',
    dueDate: daysFromNow(90),
    endDate: daysFromNow(90),
    startDate: daysAgo(14),
    leadId: 'u14',
    memberIds: ['u14', 'u15'],
    elnLinks: [],
    comments: [
      { id: 'c3', userId: 'u3', content: 'On hold pending GPU cluster availability', createdAt: daysAgo(3), isLeadershipNote: false },
    ],
    milestones: [
      { id: 'm13', title: 'Literature review', dueDate: daysAgo(7), completed: true },
      { id: 'm14', title: 'Model architecture', dueDate: daysFromNow(30), completed: false },
    ],
    tags: ['protein', 'deep-learning', 'structure'],
    priority: 'medium',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(3),
  },
  {
    id: 'p6',
    name: 'Clinical Data Integration',
    description: 'Integrate clinical trial data with genomic databases',
    department: 'Bioinfo',
    status: 'active',
    progress: 55,
    color: '#10b981',
    dueDate: daysFromNow(28),
    endDate: daysFromNow(28),
    startDate: daysAgo(42),
    leadId: 'u19',
    memberIds: ['u19', 'u20'],
    elnLinks: [
      { userId: 'u19', url: 'https://eln.nucleovir.com/pooja/clinical-data' },
      { userId: 'u20', url: 'https://eln.nucleovir.com/venkat/data-integration' },
    ],
    comments: [],
    milestones: [
      { id: 'm15', title: 'Data mapping', dueDate: daysAgo(21), completed: true },
      { id: 'm16', title: 'ETL pipeline', dueDate: daysAgo(7), completed: true },
      { id: 'm17', title: 'Dashboard development', dueDate: daysFromNow(21), completed: false },
    ],
    tags: ['clinical', 'data', 'integration'],
    priority: 'high',
    createdAt: daysAgo(42),
    updatedAt: daysAgo(1),
  },
];

// Tasks
export const tasks: Task[] = [
  // AAV Vector Optimization tasks
  {
    id: 't1',
    title: 'Design capsid variants',
    description: 'Design 5 new AAV capsid variants based on literature review',
    projectId: 'p1',
    assigneeId: 'u4',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(14),
    startDate: daysAgo(21),
    completedDate: daysAgo(15),
    subtasks: [
      { id: 's1', title: 'Literature search', completed: true, completedDate: daysAgo(18) },
      { id: 's2', title: 'Variant selection', completed: true, completedDate: daysAgo(16) },
      { id: 's3', title: 'Sequence design', completed: true, completedDate: daysAgo(15) },
    ],
    comments: [],
    tags: ['design', 'capsid'],
    progress: 100,
    order: 1,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(15),
  },
  {
    id: 't2',
    title: 'Clone capsid constructs',
    description: 'Clone all designed capsid variants into expression vectors',
    projectId: 'p1',
    assigneeId: 'u5',
    priority: 'high',
    status: 'in-progress',
    dueDate: daysFromNow(3),
    startDate: daysAgo(7),
    subtasks: [
      { id: 's4', title: 'PCR amplification', completed: true, completedDate: daysAgo(5) },
      { id: 's5', title: 'Restriction digest', completed: true, completedDate: daysAgo(3) },
      { id: 's6', title: 'Ligation & transformation', completed: false, assigneeId: 'u5' },
      { id: 's7', title: 'Colony screening', completed: false, assigneeId: 'u5' },
    ],
    comments: [],
    tags: ['cloning', 'molecular-biology'],
    progress: 50,
    order: 2,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 't3',
    title: 'Produce AAV particles',
    description: 'Scale-up production of validated AAV variants',
    projectId: 'p1',
    assigneeId: 'u6',
    priority: 'critical',
    status: 'todo',
    dueDate: daysFromNow(14),
    startDate: daysFromNow(4),
    subtasks: [],
    comments: [],
    blockedBy: ['t2'],
    blockedReason: 'Waiting for cloned constructs',
    tags: ['production', 'scale-up'],
    progress: 0,
    order: 3,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 't4',
    title: 'Transduction efficiency assay',
    description: 'Test transduction efficiency in HEK293T and primary neurons',
    projectId: 'p1',
    assigneeId: 'u7',
    priority: 'high',
    status: 'blocked',
    dueDate: daysAgo(2),
    startDate: daysAgo(10),
    subtasks: [
      { id: 's8', title: 'Cell culture prep', completed: true, completedDate: daysAgo(8) },
      { id: 's9', title: 'Transduction', completed: false },
      { id: 's10', title: 'Flow cytometry analysis', completed: false },
    ],
    comments: [
      { id: 'c4', userId: 'u7', content: 'Waiting for viral particles from scale-up', createdAt: daysAgo(3) },
    ],
    blockedBy: ['t3'],
    blockedReason: 'No viral particles available yet',
    tags: ['assay', 'transduction'],
    progress: 33,
    order: 4,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },

  // ML Drug Target tasks
  {
    id: 't5',
    title: 'Setup data pipeline',
    description: 'Configure data ingestion from public genomic databases',
    projectId: 'p2',
    assigneeId: 'u10',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(7),
    startDate: daysAgo(21),
    completedDate: daysAgo(8),
    subtasks: [],
    comments: [],
    tags: ['data', 'pipeline'],
    order: 1,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(8),
  },
  {
    id: 't6',
    title: 'Feature engineering',
    description: 'Extract and engineer features from genomic sequences',
    projectId: 'p2',
    assigneeId: 'u11',
    priority: 'critical',
    status: 'in-progress',
    dueDate: daysFromNow(5),
    startDate: daysAgo(5),
    subtasks: [
      { id: 's11', title: 'Sequence embeddings', completed: true, completedDate: daysAgo(2) },
      { id: 's12', title: 'Structural features', completed: false, assigneeId: 'u11' },
      { id: 's13', title: 'Interaction networks', completed: false, assigneeId: 'u12' },
    ],
    comments: [],
    tags: ['ml', 'features'],
    order: 2,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(0),
  },
  {
    id: 't7',
    title: 'Train baseline models',
    description: 'Train and evaluate baseline ML models',
    projectId: 'p2',
    assigneeId: 'u12',
    priority: 'high',
    status: 'todo',
    dueDate: daysFromNow(12),
    subtasks: [],
    comments: [],
    tags: ['ml', 'training'],
    order: 3,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 't8',
    title: 'Model optimization',
    description: 'Hyperparameter tuning and model optimization',
    projectId: 'p2',
    priority: 'medium',
    status: 'todo',
    dueDate: daysFromNow(25),
    subtasks: [],
    comments: [],
    tags: ['ml', 'optimization'],
    order: 4,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },

  // Variant Calling Pipeline tasks
  {
    id: 't9',
    title: 'Implement variant caller',
    description: 'Implement core variant calling algorithm',
    projectId: 'p3',
    assigneeId: 'u16',
    priority: 'critical',
    status: 'in-progress',
    dueDate: daysAgo(3),
    startDate: daysAgo(21),
    subtasks: [
      { id: 's14', title: 'Read alignment', completed: true, completedDate: daysAgo(14) },
      { id: 's15', title: 'Variant detection', completed: true, completedDate: daysAgo(7) },
      { id: 's16', title: 'Filtering & annotation', completed: false },
    ],
    comments: [
      { id: 'c5', userId: 'u16', content: 'Running into performance issues with large files', createdAt: daysAgo(1) },
    ],
    estimatedHours: 80,
    actualHours: 95,
    tags: ['pipeline', 'core'],
    order: 1,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(1),
  },
  {
    id: 't10',
    title: 'Write unit tests',
    description: 'Comprehensive unit test coverage for variant caller',
    projectId: 'p3',
    assigneeId: 'u17',
    priority: 'high',
    status: 'todo',
    dueDate: daysFromNow(3),
    subtasks: [],
    comments: [],
    tags: ['testing', 'quality'],
    order: 2,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 't11',
    title: 'Clinical validation',
    description: 'Validate pipeline against gold standard samples',
    projectId: 'p3',
    assigneeId: 'u18',
    priority: 'critical',
    status: 'todo',
    dueDate: daysFromNow(5),
    subtasks: [],
    comments: [],
    blockedBy: ['t9'],
    tags: ['validation', 'clinical'],
    order: 3,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },

  // CRISPR Screen tasks
  {
    id: 't12',
    title: 'Process screen data',
    description: 'Process raw CRISPR screen sequencing data',
    projectId: 'p4',
    assigneeId: 'u8',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(14),
    completedDate: daysAgo(16),
    subtasks: [],
    comments: [],
    tags: ['data', 'processing'],
    order: 1,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(16),
  },
  {
    id: 't13',
    title: 'Identify top hits',
    description: 'Statistical analysis to identify top screen hits',
    projectId: 'p4',
    assigneeId: 'u8',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(7),
    completedDate: daysAgo(8),
    subtasks: [],
    comments: [],
    tags: ['analysis', 'statistics'],
    order: 2,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(8),
  },
  {
    id: 't14',
    title: 'Validate top 10 hits',
    description: 'Individual validation of top 10 screen hits',
    projectId: 'p4',
    assigneeId: 'u9',
    priority: 'high',
    status: 'in-progress',
    dueDate: daysFromNow(7),
    startDate: daysAgo(5),
    subtasks: [
      { id: 's17', title: 'Clone individual guides', completed: true, completedDate: daysAgo(2) },
      { id: 's18', title: 'Generate KO cells', completed: false },
      { id: 's19', title: 'Phenotype analysis', completed: false },
    ],
    comments: [],
    tags: ['validation', 'experimental'],
    order: 3,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },

  // Protein Structure tasks
  {
    id: 't15',
    title: 'Literature review',
    description: 'Review state-of-art in protein structure prediction',
    projectId: 'p5',
    assigneeId: 'u14',
    priority: 'medium',
    status: 'done',
    dueDate: daysAgo(7),
    completedDate: daysAgo(8),
    subtasks: [],
    comments: [],
    tags: ['research', 'literature'],
    order: 1,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(8),
  },
  {
    id: 't16',
    title: 'Setup training infrastructure',
    description: 'Configure GPU cluster for model training',
    projectId: 'p5',
    assigneeId: 'u15',
    priority: 'medium',
    status: 'blocked',
    dueDate: daysFromNow(14),
    subtasks: [],
    comments: [
      { id: 'c6', userId: 'u15', content: 'GPU cluster not available until next month', createdAt: daysAgo(3) },
    ],
    blockedReason: 'GPU cluster availability',
    tags: ['infrastructure', 'gpu'],
    order: 2,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(3),
  },

  // Clinical Data Integration tasks
  {
    id: 't17',
    title: 'Map clinical schemas',
    description: 'Map clinical trial data schemas to internal format',
    projectId: 'p6',
    assigneeId: 'u19',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(14),
    completedDate: daysAgo(15),
    subtasks: [],
    comments: [],
    tags: ['data', 'schemas'],
    order: 1,
    createdAt: daysAgo(35),
    updatedAt: daysAgo(15),
  },
  {
    id: 't18',
    title: 'Build ETL pipeline',
    description: 'Implement data extraction and transformation pipeline',
    projectId: 'p6',
    assigneeId: 'u20',
    priority: 'high',
    status: 'done',
    dueDate: daysAgo(7),
    completedDate: daysAgo(9),
    subtasks: [],
    comments: [],
    tags: ['etl', 'pipeline'],
    order: 2,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(9),
  },
  {
    id: 't19',
    title: 'Design dashboard UI',
    description: 'Design user interface for clinical data dashboard',
    projectId: 'p6',
    assigneeId: 'u19',
    priority: 'medium',
    status: 'in-progress',
    dueDate: daysFromNow(14),
    startDate: daysAgo(3),
    subtasks: [
      { id: 's20', title: 'Wireframes', completed: true, completedDate: daysAgo(1) },
      { id: 's21', title: 'Visual design', completed: false },
      { id: 's22', title: 'Prototype', completed: false },
    ],
    comments: [],
    tags: ['design', 'ui'],
    order: 3,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  },
  {
    id: 't20',
    title: 'Implement visualizations',
    description: 'Build data visualization components',
    projectId: 'p6',
    assigneeId: 'u20',
    priority: 'medium',
    status: 'todo',
    dueDate: daysFromNow(21),
    subtasks: [],
    comments: [],
    blockedBy: ['t19'],
    tags: ['visualization', 'frontend'],
    order: 4,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
];

// Generate activity data for heatmaps (365 days)
export function generateActivityData(userId: string): ActivityEntry[] {
  const activity: ActivityEntry[] = [];
  const baseActivity = Math.random() * 0.5 + 0.3; // Base activity level for this user

  for (let i = 364; i >= 0; i--) {
    const date = daysAgo(i);
    // More activity on weekdays
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let count = 0;
    if (!isWeekend && Math.random() < baseActivity) {
      count = Math.floor(Math.random() * 5) + 1;
    } else if (isWeekend && Math.random() < 0.2) {
      count = Math.floor(Math.random() * 2) + 1;
    }

    activity.push({ date, count });
  }

  return activity;
}

// Quick filters for high-agency teams
export const defaultQuickFilters = [
  {
    id: 'qf1',
    name: 'My Tasks',
    filters: { assigneeIds: [] as string[] }, // Will be populated with current user
    isDefault: true,
  },
  {
    id: 'qf2',
    name: 'Critical & Overdue',
    filters: { priority: ['critical'] as Priority[], status: ['todo', 'in-progress', 'blocked'] as TaskStatus[] },
  },
  {
    id: 'qf3',
    name: 'Due This Week',
    filters: { dueDateRange: { start: daysAgo(0), end: daysFromNow(7) } },
  },
  {
    id: 'qf4',
    name: 'Blocked Tasks',
    filters: { status: ['blocked'] as TaskStatus[] },
  },
  {
    id: 'qf5',
    name: 'Unassigned',
    filters: { assigneeIds: ['unassigned'] },
  },
];

// Department colors
export const departmentColors: Record<Department, string> = {
  'Mol Bio': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'AI': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Bioinfo': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Leadership': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export const priorityColors: Record<Priority, string> = {
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'in-progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  blocked: 'bg-red-500/10 text-red-600 dark:text-red-400',
  review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'on-hold': 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'at-risk': 'bg-red-500/10 text-red-600 dark:text-red-400',
  completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};
