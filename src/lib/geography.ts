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
];

const buildLocationSuggestions = (): LocationSuggestion[] => {
  const suggestions: LocationSuggestion[] = [];

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