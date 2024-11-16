<template>
  <div>
    <link rel="stylesheet" href="https://fastly.jsdelivr.net/npm/@koumoul/vjsf@2.23.3/dist/main.min.css">
    <div v-if="vjsf_loaded">
      <v-form v-model="valid">
        <v-jsf v-model="form_data" :schema="schema"></v-jsf>
      </v-form>
    </div>
  </div>    
</template>

<script>
module.exports = {
    async created() {
        const [VJsf] = await this.import(['https://fastly.jsdelivr.net/npm/@koumoul/vjsf@2.23.3/dist/main.min.js']);
        this.$options.components['v-jsf'] = VJsf.default;
        this.vjsf_loaded = true;
    },
    methods: {
        import(deps) {
          return this.loadRequire()
              .then(() => new Promise((resolve, reject) => {
                requirejs(deps, (...modules) => resolve(modules));
              }));
        },
        loadRequire() {
          /* Needed in lab */
          if (window.requirejs) {
              console.log('require found');
              return Promise.resolve()
          }
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://fastly.jsdelivr.net/npm/requirejs@2.3.7/require.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
    }
}
</script>