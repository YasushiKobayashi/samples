---
to: <%= abs_path %>/<%= component_name %>.tsx
---
import * as React from 'react'

<% if (have_style) { -%>
import style from './<%= component_name %>.module.scss'
<% } -%>
<% if (have_props) { -%>

interface Props {
}
<% } -%>

export const <%= component_name %>: <%- type_annotate %> = <%= props %> => {
  return (
<% if (have_style) { -%>
    <<%= tag %> className={style.wrapper}>
<% } else { -%>
    <<%= tag %>>
<% } -%>
    </<%= tag %>>
  )
}
