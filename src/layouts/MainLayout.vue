<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="draggable-toolbar">
      <q-toolbar>
        <q-avatar size="xl">
          <img src="~/assets/logo-alusoft-branco.svg">
        </q-avatar>
        <q-toolbar-title style="font-size:1rem!important">Gerar Legendas Automaticamente </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script >
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MainLayout',

  components: {
  },

  setup() {
    const leftDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
});
</script>
