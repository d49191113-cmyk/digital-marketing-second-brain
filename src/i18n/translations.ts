import type { Language } from '../types/knowledge';

export interface TranslationBundle {
  brandTitle: string;
  brandSubtitle: string;
  nav: {
    home: string;
    universe: string;
    categories: string;
    notes: string;
    learning: string;
    resources: string;
    ai: string;
    settings: string;
  };
  actions: {
    searchPlaceholder: string;
    newTopic: string;
    newCategory: string;
    exploreUniverse: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    locateInUniverse: string;
    askAi: string;
    addConnection: string;
    resetCamera: string;
    switchTo2D: string;
    switchTo3D: string;
  };
  dashboard: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    totalNotes: string;
    totalCategories: string;
    completedTopics: string;
    learningProgress: string;
    dailyGoal: string;
    recentlyAdded: string;
    recentlyViewed: string;
    universeCardTitle: string;
    universeCardDesc: string;
    categoryMastery: string;
    achievementsTitle: string;
    achievementsSubtitle: string;
    weeklyProgressTitle: string;
    weeklyProgressSubtitle: string;
  };
  statuses: {
    not_started: string;
    learning: string;
    completed: string;
  };
  topicSections: {
    shortDefinition: string;
    simpleExplanation: string;
    detailedExplanation: string;
    keyConcepts: string;
    practicalExamples: string;
    realWorldApplications: string;
    stepByStepGuide: string;
    terminology: string;
    personalNotes: string;
    relatedTopics: string;
    externalResources: string;
    references: string;
    attachments: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  en: {
    brandTitle: 'Second Brain',
    brandSubtitle: 'Digital Marketing Universe',
    nav: {
      home: 'Home',
      universe: 'Knowledge Universe',
      categories: 'Marketing Categories',
      notes: 'My Notes',
      learning: 'Learning Center',
      resources: 'Resource Library',
      ai: 'AI Assistant',
      settings: 'Settings',
    },
    actions: {
      searchPlaceholder: 'Search topics, notes, tags, resources...',
      newTopic: 'New Topic',
      newCategory: 'New Category',
      exploreUniverse: 'Explore 3D Universe',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      locateInUniverse: 'Locate in Universe',
      askAi: 'Ask AI Assistant',
      addConnection: 'Connect Topics',
      resetCamera: 'Reset View',
      switchTo2D: '2D Map',
      switchTo3D: '3D Galaxy',
    },
    dashboard: {
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      totalNotes: 'Knowledge Notes',
      totalCategories: 'Marketing Planets',
      completedTopics: 'Completed Topics',
      learningProgress: 'Mastery Progress',
      dailyGoal: 'Daily Learning Goal',
      recentlyAdded: 'Recently Added Knowledge',
      recentlyViewed: 'Recently Viewed Topics',
      universeCardTitle: 'Digital Marketing Knowledge Universe',
      universeCardDesc:
        'Navigate 10 interconnected marketing galaxies orbiting the central Digital Marketing core.',
      categoryMastery: 'Mastery by Domain',
      achievementsTitle: 'Achievements & Milestones',
      achievementsSubtitle: 'Earned automatically from your study log history and topic completions.',
      weeklyProgressTitle: 'Weekly Progress',
      weeklyProgressSubtitle: 'Daily study points earned over the last 7 days.',
    },
    statuses: {
      not_started: 'Not Started',
      learning: 'Learning',
      completed: 'Completed',
    },
    topicSections: {
      shortDefinition: 'Short Definition',
      simpleExplanation: 'Simple Explanation',
      detailedExplanation: 'Detailed Explanation',
      keyConcepts: 'Key Concepts',
      practicalExamples: 'Practical Examples',
      realWorldApplications: 'Real-World Applications',
      stepByStepGuide: 'Step-by-Step Learning Guide',
      terminology: 'Important Terminology',
      personalNotes: 'Personal Notes',
      relatedTopics: 'Related Topics',
      externalResources: 'External Resources',
      references: 'References',
      attachments: 'Images & Attachments',
    },
  },
  km: {
    brandTitle: 'ខួរក្បាលទីពីរ',
    brandSubtitle: 'ចក្រវាឡចំណេះដឹង Digital Marketing',
    nav: {
      home: 'ទំព័រដើម',
      universe: 'ចក្រវាឡចំណេះដឹង',
      categories: 'ផ្នែកទីផ្សារ',
      notes: 'កំណត់ត្រារបស់ខ្ញុំ',
      learning: 'មជ្ឈមណ្ឌលសិក្សា',
      resources: 'បណ្ណាល័យធនធាន',
      ai: 'ជំនួយការ AI',
      settings: 'ការកំណត់',
    },
    actions: {
      searchPlaceholder: 'ស្វែងរកប្រធានបទ កំណត់ត្រា ស្លាក ឬធនធាន...',
      newTopic: 'បង្កើតប្រធានបទថ្មី',
      newCategory: 'បង្កើតផ្នែកថ្មី',
      exploreUniverse: 'រុករកចក្រវាឡ 3D',
      save: 'រក្សាទុក',
      cancel: 'បោះបង់',
      delete: 'លុប',
      edit: 'កែសម្រួល',
      locateInUniverse: 'បង្ហាញក្នុងចក្រវាឡ',
      askAi: 'សួរជំនួយការ AI',
      addConnection: 'ភ្ជាប់ប្រធានបទ',
      resetCamera: 'កំណត់ទិដ្ឋភាពដើម',
      switchTo2D: 'ផែនទី 2D',
      switchTo3D: 'ចក្រវាឡ 3D',
    },
    dashboard: {
      greetingMorning: 'អរុណសួស្តី',
      greetingAfternoon: 'ទិវាសួស្តី',
      greetingEvening: 'សាយ័ណ្ហសួស្តី',
      totalNotes: 'កំណត់ត្រាចំណេះដឹង',
      totalCategories: 'ភពផ្នែកទីផ្សារ',
      completedTopics: 'ប្រធានបទបានបញ្ចប់',
      learningProgress: 'វឌ្ឍនភាពសិក្សា',
      dailyGoal: 'គោលដៅសិក្សាប្រចាំថ្ងៃ',
      recentlyAdded: 'ចំណេះដឹងបន្ថែមថ្មីៗ',
      recentlyViewed: 'ប្រធានបទបានមើលថ្មីៗ',
      universeCardTitle: 'ចក្រវាឡចំណេះដឹង Digital Marketing',
      universeCardDesc:
        'រុករកភពចំណេះដឹងទីផ្សារទាំង ១០ ដែលវិលជុំវិញស្នូលកណ្តាល Digital Marketing។',
      categoryMastery: 'វឌ្ឍនភាពតាមផ្នែកនីមួយៗ',
      achievementsTitle: 'សមិទ្ធផល និងគោលដៅសិក្សា',
      achievementsSubtitle: 'ទទួលបានដោយស្វ័យប្រវត្តិពីប្រវត្តិសកម្មភាពសិក្សា និងប្រធានបទដែលបានបញ្ចប់។',
      weeklyProgressTitle: 'វឌ្ឍនភាពប្រចាំសប្តាហ៍',
      weeklyProgressSubtitle: 'ពិន្ទុសិក្សាប្រចាំថ្ងៃដែលទទួលបានក្នុងរយៈពេល ៧ ថ្ងៃចុងក្រោយ។',
    },
    statuses: {
      not_started: 'មិនទាន់ចាប់ផ្តើម',
      learning: 'កំពុងសិក្សា',
      completed: 'បានបញ្ចប់',
    },
    topicSections: {
      shortDefinition: 'និយមន័យសង្ខេប',
      simpleExplanation: 'ការពន្យល់ងាយយល់',
      detailedExplanation: 'ការពន្យល់លម្អិត',
      keyConcepts: 'គោលគំនិតសំខាន់ៗ',
      practicalExamples: 'ឧទាហរណ៍ជាក់ស្តែង',
      realWorldApplications: 'ការអនុវត្តក្នុងពិភពពិត',
      stepByStepGuide: 'មគ្គុទ្ទេសក៍សិក្សាតាមជំហាន',
      terminology: 'វាក្យស័ព្ទសំខាន់ៗ',
      personalNotes: 'កំណត់ត្រាផ្ទាល់ខ្លួន',
      relatedTopics: 'ប្រធានបទពាក់ព័ន្ធ',
      externalResources: 'ធនធានខាងក្រៅ',
      references: 'ឯកសារយោង',
      attachments: 'រូបភាព និងឯកសារភ្ជាប់',
    },
  },
};
