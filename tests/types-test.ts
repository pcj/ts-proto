import { Options, defaultOptions } from '../src/options';
import { isOptionalProperty, messageToTypeName, TypeMap } from '../src/types';
import { Code, code, imp } from 'ts-poet';
import { Utils } from '../src/main';
import { FieldDescriptorProto, FieldDescriptorProto_Label, FieldDescriptorProto_Type, MessageOptions } from 'ts-proto-descriptors';

const fakeProto = undefined as any;

describe('types', () => {
  describe('messageToTypeName', () => {
    type TestCase = {
      descr: string;
      typeMap: TypeMap;
      protoType: string;
      options?: Options;
      expected: Code;
    };
    const testCases: Array<TestCase> = [
      {
        descr: 'top-level messages',
        typeMap: new Map([['.namespace.Message', ['namespace', 'Message', fakeProto]]]),
        protoType: '.namespace.Message',
        expected: code`${imp('Message@./namespace')}`,
      },
      {
        descr: 'nested messages',
        typeMap: new Map([['.namespace.Message.Inner', ['namespace', 'Message_Inner', fakeProto]]]),
        protoType: '.namespace.Message.Inner',
        expected: code`${imp('Message_Inner@./namespace')}`,
      },
      {
        descr: 'value types',
        typeMap: new Map(),
        protoType: '.google.protobuf.StringValue',
        expected: code`string | undefined`,
      },
      {
        descr: 'value types (useOptionals=true)',
        typeMap: new Map(),
        protoType: '.google.protobuf.StringValue',
        options: { ...defaultOptions(), useOptionals: true },
        expected: code`string`,
      },
      {
        descr: 'value types (useOptionals="all")',
        typeMap: new Map(),
        protoType: '.google.protobuf.StringValue',
        options: { ...defaultOptions(), useOptionals: 'all' },
        expected: code`string`,
      },
    ];
    testCases.forEach((t) =>
      it(t.descr, async () => {
        const ctx = { options: defaultOptions(), utils: (undefined as any) as Utils, ...t };
        const got = messageToTypeName(ctx, t.protoType);
        expect(await got.toStringWithImports()).toEqual(await t.expected.toStringWithImports());
      })
    );
  });
  describe('isOptionalProperty', () => {
    type TestCase = {
      descr: string;
      field: Partial<FieldDescriptorProto>;
      messageOptions: Partial<MessageOptions> | undefined;
      options: Partial<Options>;
      want: boolean;
    };
    const testCases: Array<TestCase> = [
      {
        descr: 'baseline',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_STRING,
        },
        messageOptions: undefined,
        options: {},
        want: false,
      },
      {
        descr: 'proto3optional',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_STRING,
          proto3Optional: true,
        },
        messageOptions: undefined,
        options: {},
        want: true,
      },
      {
        descr: 'optional label',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_STRING,
          label: FieldDescriptorProto_Label.LABEL_OPTIONAL,
        },
        messageOptions: undefined,
        options: {},
        want: true,
      },
      {
        descr: 'optional message field',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_MESSAGE,
        },
        messageOptions: undefined,
        options: {
          useOptionals: 'messages'
        },
        want: true,
      },
      {
        descr: 'repeated message field',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_MESSAGE,
          label: FieldDescriptorProto_Label.LABEL_REPEATED,
        },
        messageOptions: undefined,
        options: {
          useOptionals: 'messages'
        },
        want: false,
      },
      {
        descr: 'optional all (mapEntry false)',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_STRING,
        },
        messageOptions: {
          mapEntry: false
        },
        options: {
          useOptionals: 'all'
        },
        want: true,
      },
      {
        descr: 'optional all (mapEntry true)',
        field: {
          name: 'foo',
          type: FieldDescriptorProto_Type.TYPE_STRING,
        },
        messageOptions: {
          mapEntry: true
        },
        options: {
          useOptionals: 'all'
        },
        want: false,
      },
    ];
    testCases.forEach((t) =>
      it(t.descr, async () => {
        const got = isOptionalProperty(t.field as FieldDescriptorProto, t.messageOptions as MessageOptions, t.options as Options);
        expect(t.want).toEqual(got);
      })
    );
  });
});
