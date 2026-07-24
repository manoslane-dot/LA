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