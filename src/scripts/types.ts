// Locked in as of 2.0.0
type BookSummary = {
    name: {
        short: string;
        medium: string;
        long: string;
    };
    primaryColor: string;
    secondaryColor: string;
    fileExtension: string;
    numOfSongs: number;
    addOn: boolean;
    indexAvailable: boolean;
    srcUrl?: string;
};

// Locked in as of 2.0.0
type Song = {
    title: string;
    number?: string; // Numbers unfortunately can be strings: ex: 403a GH
    notes?: string[];
};

// Song List is a dictionary of song number to song
// Locked in as of 2.0.0
type SongList = Record<string, Song>;

// Locked in as of 2.0.0
type SongReference = {
    book: string;
    number: string;
};

type SongSearchInfo = Song & {
    stripped_title?: string;
    stripped_first_line?: string;
    book: BookSummary;
};

// Dictionary of section, and list of numbers for that section
// Locked in as of 2.0.0
type BookIndex = Record<string, string[]>;

type SearchParams = {
    search: string;
    bookFilters: string[]; // Short names of books
};

export type { BookSummary, Song, SongList, SongSearchInfo, SongReference, BookIndex, SearchParams };
