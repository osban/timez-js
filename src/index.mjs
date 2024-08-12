import state    from './state.mjs'
import actions  from './actions.mjs'

import layout   from './layout.mjs'
import times    from './times.mjs'
import time     from './time.mjs'
import json     from './json.mjs'
import invoices from './invoices.mjs'
import config   from './config.mjs'
import company  from './company.mjs'
import project  from './project.mjs'
import preview  from './preview.mjs'

const S = state()
const A = actions(S)

const routes = {
  '/'        : {render: () => m(layout, {A}, m(times,    {S,A}))},
  '/times'   : {render: () => m(layout, {A}, m(times,    {S,A}))},
  '/time'    : {render: () => m(layout, {A}, m(time,     {S,A}))},
  '/json'    : {render: () => m(layout, {A}, m(json,     {S}))},
  '/invoices': {render: () => m(layout, {A}, m(invoices, {S,A}))},
  '/config'  : {render: () => m(layout, {A}, m(config,   {S,A}))},
  '/company' : {render: () => m(layout, {A}, m(company,  {S,A}))},
  '/project' : {render: () => m(layout, {A}, m(project,  {S,A}))},
  '/preview' : {render: () => m(preview, {S})}
}

m.route(document.body, '/', routes)
