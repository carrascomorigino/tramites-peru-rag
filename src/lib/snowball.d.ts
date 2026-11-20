declare module 'snowball-stemmers' {
  const snowball: { newStemmer(lang: string): { stem(word: string): string } };
  export default snowball;
}
