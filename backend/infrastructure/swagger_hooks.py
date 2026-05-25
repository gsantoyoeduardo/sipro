TYPE_EXAMPLES = {
    'string': 'texto',
    'boolean': True,
    'integer': 0,
    'number': 0.0,
    'object': {},
    'array': [],
}


def add_examples(result, generator, request, public):
    schemas = result.get('components', {}).get('schemas', {})
    for name, schema in schemas.items():
        props = schema.get('properties', {})
        for pname, prop in props.items():
            if 'example' not in prop:
                example = TYPE_EXAMPLES.get(prop.get('type'))
                if example is not None:
                    prop['example'] = example
    return result
