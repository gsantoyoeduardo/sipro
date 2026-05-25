from drf_spectacular.openapi import AutoSchema


class TagsAutoSchema(AutoSchema):
    def get_tags(self):
        view_tags = getattr(self.view, 'swagger_tags', None)
        if view_tags:
            return [view_tags]
        return super().get_tags()
