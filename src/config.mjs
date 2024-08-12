import svgs from './svgs.mjs'

export default ({attrs: {S,A}}) => {
  if (!S.loaded) A.init()

  return {
    onbeforeupdate: () => {
      if (!S.loaded) A.init()
    },

    view: () =>
      m('div', {class: 'p-4'},
        m('div', {class: 'flex mb-2'},
          m('h2', {class: 'text-2xl font-bold'}, 'Companies'),
          m('button', {
            class: S.classes.plus,
            onclick: () => {
              S.comp = {}
              m.route.set('/company')
            }
          }, '+')
        ),
        m('div',
          S.companies.length > 0
          ? m('table',
              m('tbody',
                S.companies.map(company =>
                  m('tr',
                    m('td', {class: 'px-3'}, company.name),
                    m('td', {class: 'flex'},
                      m('span', {
                        class: 'cursor-pointer',
                        title: 'edit',
                        onclick: () => {
                          S.comp = company
                          m.route.set('/company')
                        }
                      }, svgs.edit),
                      m('span', {
                        class: 'cursor-pointer mt-0.5',
                        onclick: () => {
                          if (confirm(`Are you sure you wish to delete ${company.name}?`)) {
                            A.del('companies', company.id)
                          }
                        }
                      }, svgs.crossred)
                    )
                  )
                )
              )
            )
          : m('h5', {class: 'text-lg font-bold'}, 'No company found')
        ),

        m('div', {class: 'flex mt-8 mb-2'},
          m('h2', {class: 'text-2xl font-bold'}, 'Projects'),
          m('button', {
            class: S.classes.plus,
            onclick: () => {
              S.comp = {}
              m.route.set('/project')
            }
          }, '+')
        ),
        m('div',
          S.projects.length > 0
          ? m('table',
              m('tbody',
                S.projects.map(project =>
                  m('tr',
                    m('td', {class: 'px-3'}, project.name),
                    m('td', {class: 'flex'},
                      m('span', {
                        class: 'cursor-pointer',
                        title: 'edit',
                        onclick: () => {
                          S.proj = project
                          m.route.set('/project')
                        }
                      }, svgs.edit),
                      m('span', {
                        class: 'cursor-pointer mt-0.5',
                        onclick: () => {
                          if (confirm(`Are you sure you wish to delete ${project.name}?`)) {
                            A.del('projects', project.id)
                          }
                        }
                      }, svgs.crossred)
                    )
                  )
                )
              )
            )
          : m('h5', {class: 'text-lg font-bold'}, 'No projects found')
        )
      )
  }
}
