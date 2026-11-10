import React from 'react';
import {Composition} from 'remotion';
import {Colagem, duracaoTotal} from './Colagem';
import {roteiros} from './roteiros';

export const RemotionRoot: React.FC = () => (
  <>
    {roteiros.map((roteiro) => {
      const fps = roteiro.formato?.fps ?? 24;
      return (
        <Composition
          key={roteiro.id}
          id={roteiro.id}
          component={Colagem}
          durationInFrames={duracaoTotal(roteiro, fps)}
          fps={fps}
          width={roteiro.formato?.largura ?? 1080}
          height={roteiro.formato?.altura ?? 1920}
          defaultProps={{roteiro, mostrarGuias: false}}
        />
      );
    })}
  </>
);
