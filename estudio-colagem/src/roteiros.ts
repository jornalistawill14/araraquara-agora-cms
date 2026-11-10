import type {Roteiro} from './tipos';

// Todo arquivo .json em roteiros/ vira uma composição, sem precisar registrar à mão.
const contexto = require.context('../roteiros', false, /\.json$/);

export const roteiros: Roteiro[] = contexto
  .keys()
  .map((chave) => contexto(chave) as Roteiro)
  .filter((r) => r && typeof r.id === 'string' && Array.isArray(r.cenas));
