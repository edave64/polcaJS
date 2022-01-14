polcaStd = Polca.compile(`(_ +) '- :

(1 +) ['inc '++] ::
(1 -) ['dec '--] ::

(= _ ++) ['/= '!= '≠] ::

(compare -1  =) '< :
(compare  1  =) '> :
(compare -1 !=) ['>= '≥] ::
(compare  1 !=) ['<= '≤] ::

('fun : 'vec : ['vec . 'fun . each]) ['map '!>] ::
('fun : shift >< 'fun . each) ['fold '!/] ::`)