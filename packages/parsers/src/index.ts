export * from './types';
export * from './BaseParser';
export * from './helpers';
export * from './locationParser';
export * from './registry';

import { registry } from './registry';
import { GlassdoorParser } from './parsers/glassdoor';
import { GeekJobParser } from './parsers/geekjob';
import { LayboardParser } from './parsers/layboard';

registry.register(new GlassdoorParser());
registry.register(new GeekJobParser());
registry.register(new LayboardParser());
