'use strict'
import 'lodash/lodash'
import 'popper.js/dist/popper'
import 'bootstrap/dist/js/bootstrap'
import OwnedPluginForm from './owned_plugin_form'

$(document).ready(() => {
  new Vue({
    el: '#in-tail-parse',
    props: [
      "targetFile",
      "parseType",
    ],
    data: () => {
      return {
        highlightedLines: null
      }
    },
    computed: {
      token: function() {
        return Rails.csrfToken()
      }
    },
    components: {
      'owned-plugin-form': OwnedPluginForm
    },
    watch: {
      'parse.expression': function() {
        console.log('parse.expression')
        this.preview()
      },
      'parse.timeFormat': function() {
        console.log('parse.timeFormat')
        this.preview()
      },
      'parseType': function() {
        this.preview()
      },
    },
    mounted: function() {
      this.parse = {}
    },
    methods: {
      onChangePluginName: function(name) {
        console.log("onChangePluginName")
        this.parseType = name
      },
      onChangeParseConfig: function(data) {
        console.log("onChangeParseConfig")
        _.merge(this.parse, data)
        this.preview()
      },
      updateHighlightedLines: function(matches) {
        if (!matches) {
          this.highlightedLines = null
          return
        }

        let $container = $('<div>')
        _.each(matches, (match) => {
          const colors = ["#ff9", "#cff", "#fcf", "#dfd"]
          const whole = match.whole
          let html = ""
          let _matches = []
          let lastPos = 0

          _.each(match.matches, (m) => {
            let matched = m.matched
            if (!matched) {
              return
            }
            // Ignore empty matched with "foobar".match(/foo(.*?)bar/)[1] #=> ""
            if (matched.length === 0) {
              return
            }
            // rotate color
            let currentColor = colors.shift()
            colors.push(currentColor)

            // create highlighted range HTML
            let $highlighted = $("<span>").text(matched)
            $highlighted.attr({
              "class": "regexp-preview",
              "data-toggle": "tooltip",
              "data-placement": "top",
              "title": match.key,
              'style': 'background-color:' + currentColor
            })
            let highlightedHtml = $highlighted.wrap("<div>").parent().html()

            let pos = {
              start: match.pos[0],
              ent: match.pos[1]
            }
            if (pos.start > 0) {
              html += _.escape(whole.substring(lastPos, pos.start))
            }
            html += highlightedHtml
            lastPos = pos.end
          })
          html += whole.substring(lastPos)

          $container.append(html)
          $container.append("<br>")
        })

        this.highlightedLines = $container.html()
      },

      preview: function() {
        console.log("preview!!!!")
        if (this.previewAjax) {
          this.previewAjax.abort()
        }

        this.previewAjax = $.ajax({
          method: "POST",
          url: "/api/regexp_preview",
          headers: {
            'X-CSRF-Token': this.token
          },
          data: {
            expression: this.parse.expression,
            time_format: this.parse.timeFormat,
            parse_type: _.isEmpty(this.parseType) ? "regexp" : this.parseType,
            file: this.targetFile
          }
        }).then(
          (result) => {
            this.params = _merge(this.params, result.params)
            this.updateHighlightedLines(result.matches)
          },
          (error) => {
            if (error.stack) {
              console.error(error.stack)
            }
          })
      }
    }
  })
})
