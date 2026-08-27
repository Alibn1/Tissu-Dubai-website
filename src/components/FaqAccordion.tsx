'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import {ChevronDown} from 'lucide-react';

type FaqAccordionProps = {
  questions: {question: string; answer: string}[];
};

export function FaqAccordion({questions}: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {questions.map((item, index) => (
        <div
          key={index}
          className={cn(
            'rounded-md border border-brand-border bg-brand-surface',
            'transition-colors',
            openIndex === index && 'border-brand-primary/30'
          )}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className={cn(
              'flex w-full items-center justify-between gap-4 px-5 py-4',
              'text-start text-sm font-semibold sm:text-base',
              'text-brand-secondary hover:text-brand-primary',
              'transition-colors'
            )}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 flex-shrink-0 text-brand-muted transition-transform duration-200',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>

          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="px-5 pb-4 text-sm leading-relaxed text-brand-muted">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
