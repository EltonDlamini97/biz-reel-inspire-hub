export type Movie = {
  id: string;
  title: string;
  year: string;
  overview: string;
  genres: string[];
  rating: number;
  poster: string | null;
  backdrop: string | null;
};

export type MovieDetail = Movie & {
  runtime: number | null;
  trailerKey: string | null;
  providers: { name: string; logo: string | null }[];
  providerLink: string | null;
  recommendations: Movie[];
};

export const GENRES = ["Action", "Drama", "Comedy", "Sci-Fi", "Animation", "Thriller", "Documentary", "Romance"];

export const SAMPLE_MOVIES: Movie[] = [
  { id: "s1", title: "Tsotsi", year: "2005", overview: "A young Johannesburg gang leader's life changes after he unexpectedly finds himself caring for a baby.", genres: ["Drama"], rating: 7.2 },
  { id: "s2", title: "District 9", year: "2009", overview: "Extraterrestrial refugees are confined to a slum in Johannesburg, and one bureaucrat's life is upended.", genres: ["Sci-Fi", "Action", "Thriller"], rating: 7.9 },
  { id: "s3", title: "Black Panther", year: "2018", overview: "T'Challa returns home to Wakanda to take his place as king and protector of his nation.", genres: ["Action", "Sci-Fi"], rating: 7.3 },
  { id: "s4", title: "The Pursuit of Happyness", year: "2006", overview: "A struggling salesman takes custody of his son as he begins a life-changing professional career.", genres: ["Drama"], rating: 8.0 },
  { id: "s5", title: "Invictus", year: "2009", overview: "Nelson Mandela unites a nation through the 1995 Rugby World Cup.", genres: ["Drama"], rating: 7.3 },
  { id: "s6", title: "Coco", year: "2017", overview: "A boy journeys into the Land of the Dead to discover his family's history.", genres: ["Animation", "Comedy"], rating: 8.2 },
  { id: "s7", title: "Hidden Figures", year: "2016", overview: "Three brilliant women at NASA help launch a historic space mission.", genres: ["Drama"], rating: 7.8 },
  { id: "s8", title: "The Boy Who Harnessed the Wind", year: "2019", overview: "A Malawian boy builds a wind turbine to save his village from famine.", genres: ["Drama"], rating: 7.6 },
  { id: "s9", title: "Inception", year: "2010", overview: "A thief who steals secrets through dreams is given a chance at redemption.", genres: ["Sci-Fi", "Action", "Thriller"], rating: 8.4 },
  { id: "s10", title: "Paddington 2", year: "2017", overview: "Paddington takes on odd jobs to buy a gift and is framed for theft.", genres: ["Comedy", "Animation"], rating: 7.8 },
  { id: "s11", title: "Rocky", year: "1976", overview: "A small-time boxer gets a supremely rare chance to fight the heavyweight champion.", genres: ["Drama"], rating: 7.7 },
  { id: "s12", title: "My Octopus Teacher", year: "2020", overview: "A filmmaker forges an unusual friendship with an octopus in a South African kelp forest.", genres: ["Documentary"], rating: 8.0 },
].map((m) => ({ ...m, poster: null, backdrop: null }));

export const trailerSearchUrl = (title: string, year?: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year ?? ""} official trailer`)}`;
export const justWatchUrl = (title: string) =>
  `https://www.justwatch.com/za/search?q=${encodeURIComponent(title)}`;
