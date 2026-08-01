export interface Municipality {
  name: string;
  settlements: string[];
}

export interface RegionalUnit {
  name: string;
  municipalities: Municipality[];
}

export interface Region {
  name: string;
  regionalUnits: RegionalUnit[];
}

export interface LocationSuggestion {
  label: string;
  address: string;
  city: string;
  postalCode: string;
}

const postalCodeBySettlement: Record<string, string> = {
  'Αλεξάνδρεια': '590 01',
  'Βέροια': '591 00',
  'Νάουσα': '592 00',
  'Αθήνα': '104 31',
  'Θεσσαλονίκη': '546 25',
  'Πάτρα': '264 41',
  'Ηράκλειο': '712 02',
  'Λάρισα': '412 22',
  'Βόλος': '382 21',
  'Ιωάννινα': '455 00',
  'Τρίπολη': '221 00',
  'Καλαμάτα': '241 00',
  'Χανιά': '731 00',
  'Ρόδος': '851 00',
  'Κομοτηνή': '691 00',
  'Αγρίνιο': '301 00',
  'Καβάλα': '654 04',
  'Σέρρες': '621 24',
  'Κόρινθος': '201 00',
  'Πειραιάς': '185 31',
  'Χαλκίδα': '341 00',
  'Αρτα': '471 00',
  'Καρδίτσα': '431 00',
  'Τρίκαλα': '421 00',
  'Φλώρινα': '531 00',
  'Καστοριά': '521 00',
  'Γρεβενά': '511 00',
  'Κοζάνη': '501 00',
  'Μυτιλήνη': '811 00',
  'Σάμος': '831 00',
  'Ικαρία': '833 00',
  'Κως': '853 00',
  'Σύρος': '841 00',
  'Μέγαρα': '192 00',
  'Αίγιο': '251 00',
};

export const geography: Region[] = [
  {
    name: 'Κεντρική Μακεδονία',
    regionalUnits: [
      {
        name: 'Ημαθία',
        municipalities: [
          {
            name: 'Δήμος Βέροιας',
            settlements: [
              'Βέροια',
              'Άγιος Γεώργιος',
              'Άγιος Παύλος',
              'Αγία Μαρίνα',
              'Ασώματα',
              'Βεργίνα',
              'Διαβατός',
              'Κουλούρα',
              'Κουμαριά',
              'Λαζοχώρι',
              'Λευκάδια',
              'Μακροχώρι',
              'Παλατίτσια',
              'Ράχη',
              'Τρίλοφος',
              'Φυτειά',
            ],
          },
          {
            name: 'Δήμος Νάουσας',
            settlements: [
              'Νάουσα',
              'Άγιος Παύλος',
              'Αρκοχώρι',
              'Γιαννακοχώρι',
              'Επισκοπή',
              'Ζερβοχώρι',
              'Κοπανός',
              'Λευκάδια',
              'Μαρίνα',
              'Μονόσπιτα',
              'Πολυδένδρι',
              'Ροδοχώρι',
              'Στενήμαχος',
            ],
          },
          {
            name: 'Δήμος Αλεξάνδρειας',
            settlements: [
              'Αλεξάνδρεια',
              'Αράχωβος',
              'Βρυσάκι',
              'Καβάσιλα',
              'Κλειδί',
              'Κορυφή',
              'Κυδωνιά',
              'Λιανοβέργι',
              'Μελίκη',
              'Νησί',
              'Νεοχώρι',
              'Παλαιοχώρι',
              'Πλατύ',
              'Πρασινάδα',
              'Τρίκαλα',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Αττική',
    regionalUnits: [
      {
        name: 'Αθήνα',
        municipalities: [
          {
            name: 'Δήμος Αθηναίων',
            settlements: [
              'Αθήνα',
              'Πλάκα',
              'Μοναστηράκι',
              'Πατήσια',
              'Νέος Κόσμος',
              'Αγία Παρασκευή',
              'Κολωνός',
              'Γουδή',
              'Ζωγράφου',
              'Μεταξουργείο',
              'Νίκαια',
              'Πειραιάς',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Μακεδονία',
    regionalUnits: [
      {
        name: 'Θεσσαλονίκη',
        municipalities: [
          {
            name: 'Δήμος Θεσσαλονίκης',
            settlements: [
              'Θεσσαλονίκη',
              'Καλαμαριά',
              'Πυλαία',
              'Αμπελόκηποι',
              'Νεάπολη',
              'Τούμπα',
              'Εύοσμος',
              'Σταυρούπολη',
              'Κορδελιό',
              'Πολίχνη',
            ],
          },
        ],
      },
      {
        name: 'Σέρρες',
        municipalities: [
          {
            name: 'Δήμος Σερρών',
            settlements: [
              'Σέρρες',
              'Αμφίπολη',
              'Νιγρίτα',
              'Αλιστράτη',
              'Σιδηρόκαστρο',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Θεσσαλία',
    regionalUnits: [
      {
        name: 'Λάρισα',
        municipalities: [
          {
            name: 'Δήμος Λαρισαίων',
            settlements: [
              'Λάρισα',
              'Βόλος',
              'Τρίκαλα',
              'Καρδίτσα',
              'Αγιά',
              'Νίκαια Λάρισας',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Πελοπόννησος',
    regionalUnits: [
      {
        name: 'Κορινθία',
        municipalities: [
          {
            name: 'Δήμος Κορίνθου',
            settlements: [
              'Κόρινθος',
              'Νεμέα',
              'Ξυλόκαστρο',
              'Λουτράκι',
              'Βέλο',
              'Άργος',
            ],
          },
        ],
      },
      {
        name: 'Μεσσηνία',
        municipalities: [
          {
            name: 'Δήμος Καλαμάτας',
            settlements: [
              'Καλαμάτα',
              'Μεσσήνη',
              'Αρχεία',
              'Κυπαρισσία',
              'Πύλος',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Ήπειρος',
    regionalUnits: [
      {
        name: 'Ιωάννινα',
        municipalities: [
          {
            name: 'Δήμος Ιωαννιτών',
            settlements: [
              'Ιωάννινα',
              'Ζαγόρι',
              'Μέτσοβο',
              'Δωδώνη',
              'Παρακάλαμος',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Δυτική Ελλάδα',
    regionalUnits: [
      {
        name: 'Αχαΐα',
        municipalities: [
          {
            name: 'Δήμος Πατρών',
            settlements: [
              'Πάτρα',
              'Αίγιο',
              'Καλάβρυτα',
              'Ρίο',
              'Ακράτα',
            ],
          },
        ],
      },
      {
        name: 'Αιτωλοακαρνανία',
        municipalities: [
          {
            name: 'Δήμος Αγρινίου',
            settlements: [
              'Αγρίνιο',
              'Μονή',
              'Ναύπακτος',
              'Αλυζία',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Κρήτη',
    regionalUnits: [
      {
        name: 'Ηράκλειο',
        municipalities: [
          {
            name: 'Δήμος Ηρακλείου',
            settlements: [
              'Ηράκλειο',
              'Χερσόνησος',
              'Γούρνες',
              'Αγία Πελαγία',
              'Μάλια',
              'Αρκαλοχώρι',
            ],
          },
        ],
      },
      {
        name: 'Χανιά',
        municipalities: [
          {
            name: 'Δήμος Χανίων',
            settlements: [
              'Χανιά',
              'Κίσσαμος',
              'Αγία Ρούμελη',
              'Καλυθιές',
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Αegean',
    regionalUnits: [
      {
        name: 'Ρόδος',
        municipalities: [
          {
            name: 'Δήμος Ρόδου',
            settlements: [
              'Ρόδος',
              'Κάλυμνος',
              'Κως',
              'Σύρος',
              'Μυτιλήνη',
              'Σάμος',
            ],
          },
        ],
      },
    ],
  },
];

const buildLocationSuggestions = (): LocationSuggestion[] => {
  const suggestions: LocationSuggestion[] = [];
  const streetNames = [
    'Αγίου Κωνσταντίνου',
    'Αγίου Δημητρίου',
    'Ελευθερίου Βενιζέλου',
    'Πατησίων',
    'Κηφισίας',
    'Μεγάλου Αλεξάνδρου',
    'Ιωάννου Μεταξά',
    'Λεωφόρος Κηφισίας',
    'Μακαρίου',
    'Σοφοκλέους',
    'Δημοκρατίας',
    'Αριστοτέλους',
    'Πανεπιστημίου',
    'Ελ. Βενιζέλου',
    'Κωνσταντινουπόλεως',
    'Μητροπόλεως',
    'Αριστομένη',
    'Νέας Ερυθραίας',
    'Οδού Εθνικής Αντιστάσεως',
    'Λεωφόρος Συγγρού',
    'Περικλέους',
  ];

  geography.forEach((region) => {
    region.regionalUnits.forEach((regionalUnit) => {
      regionalUnit.municipalities.forEach((municipality) => {
        municipality.settlements.forEach((settlement) => {
          suggestions.push({
            label: `${settlement}, ${municipality.name}`,
            address: settlement,
            city: settlement,
            postalCode: postalCodeBySettlement[settlement] ?? '000 00',
          });

          streetNames.forEach((streetName) => {
            const streetAddress = `${streetName} ${Math.max(1, Math.floor(Math.random() * 120) + 1)}`;
            suggestions.push({
              label: `${streetAddress}, ${settlement}`,
              address: streetAddress,
              city: settlement,
              postalCode: postalCodeBySettlement[settlement] ?? '000 00',
            });
          });
        });
      });
    });
  });

  return suggestions;
};

const locationSuggestions = buildLocationSuggestions();

const normalizeSuggestionText = (value: string) => value.trim().toLowerCase();

export function getAddressSuggestions(query: string, field: 'address' | 'city' | 'postalCode' = 'address') {
  const normalizedQuery = normalizeSuggestionText(query);

  if (!normalizedQuery) {
    return locationSuggestions.slice(0, 8);
  }

  return locationSuggestions.filter((suggestion) => {
    const haystacks = field === 'postalCode'
      ? [suggestion.postalCode, suggestion.city, suggestion.address]
      : [suggestion.label, suggestion.address, suggestion.city];

    return haystacks.some((value) => normalizeSuggestionText(value).includes(normalizedQuery));
  }).slice(0, 6);
}

export function getRegionalUnit(regionName: string, regionalUnitName: string) {
  return geography
    .find((region) => region.name === regionName)
    ?.regionalUnits.find((regionalUnit) => regionalUnit.name === regionalUnitName);
}

export function getSettlements(
  regionName: string,
  regionalUnitName: string,
  municipalityName: string,
) {
  return getRegionalUnit(regionName, regionalUnitName)
    ?.municipalities.find((municipality) => municipality.name === municipalityName)
    ?.settlements ?? [];
}