// Tipagem do require.context do webpack (usado pelo bundler do Remotion).
declare namespace NodeJS {
  interface Require {
    context(
      diretorio: string,
      subpastas: boolean,
      filtro: RegExp,
    ): {keys(): string[]; (chave: string): unknown};
  }
}
