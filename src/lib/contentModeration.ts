const BASE_PROFANITY_WORDS = [
	'μαλακας',
	'μαλακισμενος',
	'μαλακισμενη',
	'πουστης',
	'πουτανα',
	'γαμιεσαι',
	'γαμω',
	'αρχιδι',
	'σκατα',
	'καριολης',
	'κωλο',
	'μουνι',
	'fuck',
	'fucking',
	'shit',
	'bitch',
	'asshole',
	'bastard',
	'cunt',
	'dick',
	'motherfucker',
];

const normalizeWord = (word: string) =>
	word
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();

const parseExtraProfanityWords = () => {
	const raw = process.env.NEXT_PUBLIC_EXTRA_PROFANITY_WORDS ?? '';
	if (!raw.trim()) {
		return [] as string[];
	}

	return raw
		.split(',')
		.map((word) => word.trim())
		.filter(Boolean);
};

const getNormalizedProfanitySet = () => {
	const allWords = [...BASE_PROFANITY_WORDS, ...parseExtraProfanityWords()];
	return new Set(allWords.map((word) => normalizeWord(word)));
};

export function censorProfanity(value: string): string {
	if (!value) {
		return '';
	}

	const normalizedProfanity = getNormalizedProfanitySet();

	return value.replace(/[A-Za-zΑ-Ωα-ωΆ-ώ]+/g, (word) => {
		const normalized = normalizeWord(word);
		if (!normalizedProfanity.has(normalized)) {
			return word;
		}

		return '*'.repeat(word.length);
	});
}
