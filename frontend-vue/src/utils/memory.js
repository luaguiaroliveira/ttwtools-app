// Memória das telas de Comparar entre navegações: clicar num texto de um gráfico leva ao Leitor e o botão voltar
// precisa trazer a comparação como estava (resultado, filtros e gráfico escolhido), sem recalcular.
// Fora do estado reativo de propósito: só é lida quando a tela nasce.
export const kfaMemory = { value: null }
export const galleryMemory = { order: 'asc', kind: 'bars', nFeatures: 10, method: 'pca2d', cache: new Map() }
