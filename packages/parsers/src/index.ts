export * from './types';
export * from './BaseParser';
export * from './helpers';
export * from './locationParser';
export * from './registry';

import { registry } from './registry';
import { GlassdoorParser } from './parsers/glassdoor';
import { GeekJobParser } from './parsers/geekjob';
import { LayboardParser } from './parsers/layboard';
import { HabrParser } from './parsers/habr';
import { AvitoParser } from './parsers/avito';
import { RabotaRuParser } from './parsers/rabotaru';
import { FLRuParser } from './parsers/flru';

registry.register(new GlassdoorParser());
registry.register(new GeekJobParser());
registry.register(new LayboardParser());
registry.register(new HabrParser());
registry.register(new AvitoParser());
registry.register(new RabotaRuParser());
registry.register(new FLRuParser());
