import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { respell } from '../lib/pronounce';
import Pronunciation from '../components/vocabulary/Pronunciation';

describe('respell: IPA from the CMU dictionary -> a pronunciation students can read', () => {
  it.each([
    ['/əˈkjumjəˌleɪt/', 'uh-KYOO-myuh-layt'], // the card in the report
    ['/æbˈstrækt/', 'ab-STRAKT'], // a stress mark starts its syllable
    ['/ˈæləˌkeɪt/', 'A-luh-kayt'], // secondary stress stays lower case
    ['/əˈnælədʒi/', 'uh-NA-luh-jee'], // dʒ -> j
    ['/məˈtɪkjələs/', 'muh-TI-kyuh-luhs'], // kj onset kept together
    ['/juˈbɪkwɪtəs/', 'yoo-BI-kwi-tuhs'], // j -> y, kw onset
    ['/ˈtaɪm/', 'TYM'], // aɪ after a consonant -> y
    ['/ˈaɪdəl/', 'EYE-duhl'], // aɪ on its own -> eye
    ['/ˈsloʊ ˈdaʊn/', 'SLOH DOWN'], // phrases keep their words
  ])('%s -> %s', (ipa, plain) => {
    expect(respell(ipa)).toBe(plain);
  });

  it('returns null for anything outside the dictionary symbols, or nothing at all', () => {
    expect(respell('/ʔa/')).toBeNull();
    expect(respell('')).toBeNull();
    expect(respell(undefined)).toBeNull();
  });
});

describe('Pronunciation', () => {
  afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it('Listen reads the word aloud with the device voice, a little slower', async () => {
    const spoken = [];
    window.SpeechSynthesisUtterance = function Utterance(text) {
      this.text = text;
    };
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn((u) => spoken.push(u)), getVoices: () => [{ lang: 'en-GB' }, { lang: 'en-US', name: 'US' }] };
    render(<Pronunciation word="Accumulate" ipa="/əˈkjumjəˌleɪt/" source="CMUDICT" />);
    expect(screen.getByText('uh-KYOO-myuh-layt')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Listen: Accumulate' }));
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toMatchObject({ text: 'Accumulate', lang: 'en-US', rate: 0.85 });
    expect(spoken[0].voice.name).toBe('US');
  });

  it('without a device voice there is no Listen button, only the respelling', () => {
    render(<Pronunciation word="Accept" ipa="/ækˈsɛpt/" />);
    expect(screen.queryByRole('button', { name: /Listen/ })).toBeNull();
    expect(screen.getByText('ak-SEPT')).toBeInTheDocument();
  });
});
