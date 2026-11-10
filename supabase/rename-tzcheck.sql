-- Rename category slug/name from jamiicheck to tzcheck
UPDATE public.categories
SET slug = 'tzcheck',
    name_en = 'TzCheck',
    name_sw = 'TzCheck',
    description_en = 'Fact-checking claims circulating in Tanzania. Truth over rumors.',
    description_sw = 'Ukaguzi wa ukweli wa madai yanayozunguka Tanzania. Ukweli juu ya uvumi.'
WHERE slug = 'jamiicheck';
