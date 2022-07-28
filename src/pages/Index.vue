<template>
  <q-page class="row items-center justify-evenly">
    <q-toggle
      v-model="data.darkMode"
      checked-icon="dark_mode"
      color="purple-12"
      label=""
      unchecked-icon="wb_sunny"
      @update:model-value="toggleDarkMode"
    />
    <q-form
      ref="form"
      @submit="onSubmit"
      @reset="onReset"
      class="q-gutter-md q-ml-md"
    >
      <div class="row">
        <q-input
          color="purple-12"
          v-model="data.bucket"
          label="Bucket"
          class="col-12"
          required
          :rules="[(val) => (val && val.length > 0) || 'Bucket é obrigatório']"
        >
          <template v-slot:prepend>
            <q-icon name="folder" />
          </template>
        </q-input>
        <q-input
          rounded
          outlined
          @click="readCredentials"
          bottom-slots
          v-model="data.credentialsName"
          label="Credenciais"
          class="col-12 q-pt-sm upload"
          readonly
          required
          :rules="[
            (val) => (val && val.length > 0) || 'Credenciais é obrigatório',
          ]"
        >
          <template v-slot:before>
            <q-icon name="lock" />
          </template>
        </q-input>

        <q-input
          rounded
          outlined
          bottom-slots
          v-model="data.media"
          :label="videoLabel"
          class="col-12 q-pt-sm upload"
          @drop.prevent.stop="drop"
          @dragenter.prevent.stop="dragenter"
          @dragleave.prevent.stop="dragleave"
          @dragover.prevent.stop
          @click="openFile"
          ref="video"
          readonly
          required
          :rules="[(val) => (val && val.length > 0) || 'Vídeo é obrigatório']"
        >
          <template v-slot:before>
            <q-icon name="movie" />
          </template>
        </q-input>

        <q-checkbox v-model="data.save" label="Salvar preenchimento" />
      </div>
      <div>
        <q-btn label="Gerar Legendas! 👨‍💻" type="submit" color="primary" />
        <q-btn
          label="Limpar 🧹"
          type="reset"
          :color="data.darkMode ? 'white' : 'primary'"
          flat
          class="q-ml-sm"
        />
      </div>
    </q-form>
    <img
      class="logo-end"
      v-if="data.darkMode"
      src="~/assets/logo-alusoft-branco.svg"
    />
    <img class="logo-end" v-else src="~/assets/logo-alusoft-preto.svg" />
  </q-page>
</template>
<style lang="scss">
.logo-end {
  max-width: 20%;
}
.upload {
  cursor: pointer !important;
}
.upload input {
  cursor: pointer !important;
}
.activeBorder:before {
  border-color: #000 !important;
}
</style>
<script>
import { Notify, Loading } from "quasar";
import { Dark } from "quasar";

export default {
  data() {
    const data = {
      bucket: "",
      credentials: null,
      credentialsName: null,
      media: null,
      save: true,
      darkMode: false,
    };
    return {
      videoLabel: "Selecione o vídeo",
      data,
    };
  },
  async mounted() {
    const savedData = await window.alusoftAPI.read();
    Object.assign(this.data, savedData);
    Dark.set(!!this.data.darkMode);
  },
  methods: {
    onSubmit() {
      this.$refs.form.resetValidation();
      this.$refs.form.validate().then((success) => {
        if (!success) return;
        if (this.data.save) {
          this.saveData();
        }
        this.createSubtitles();
        Notify.create({
          color: "green-4",
          textColor: "white",
          icon: "cloud_done",
          message: "Processo inciado!",
        });
      });
    },

    async onReset() {
      this.data.bucket = "";
      this.data.credentials = null;
      this.data.credentialsName = null;
      this.data.media = null;
      this.data.save = true;
      await window.alusoftAPI.clear();
    },
    async saveData() {
      let dataToSave = {
        bucket: this.data.bucket,
        credentials: this.data.credentials,
        credentialsName: this.data.credentialsName,
        save: this.data.save,
        darkMode: this.data.darkMode,
      };
      await window.alusoftAPI.store(JSON.stringify(dataToSave));
    },
    async readCredentials() {
      const [credentialsJSON, credentialsName] =
        await window.alusoftAPI.openCredentials();
      this.data.credentials = JSON.parse(credentialsJSON);
      this.data.credentialsName = credentialsName;
    },
    async drop(event) {
      //debugger;
      this.data.media = event.dataTransfer.files[0].path;
      this.dragleave();
      this.$nextTick(() => {
        this.$refs.form.submit();
      });
    },
    dragenter() {
      this.$refs.video.$el
        .querySelector(".q-field__control")
        .classList.add("activeBorder");
      //Loading.show();
      this.videoLabel = "Iniciar a mágica! 🪄";

      // console.log("File is in the Drop Space");
    },
    dragleave() {
      this.$refs.video.$el
        .querySelector(".q-field__control")
        .classList.remove("activeBorder");
      this.videoLabel = "Selecione o vídeo";
    },
    async openFile() {
      this.data.media = await window.alusoftAPI.openFile();
    },
    async createSubtitles() {
      try {
        Loading.show({
          message:
            "Gerando legendas usando Inteligência Artificial ✏️. Aguarde..",
          boxClass: "bg-grey-2 text-grey-9",
        });
        window.alusoftAPI.subtitleUpdate((evt, message) => {
          Loading.show({ message, boxClass: "bg-grey-2 text-grey-9" });
        });

        let result = await window.alusoftAPI.createSubtitle(
          JSON.parse(JSON.stringify(this.data))
        );
        if (result !== true) throw new Error(result);
        Notify.create({
          color: "green-4",
          textColor: "white",
          icon: "verified",
          message: "Legendas geradas com sucesso ! 🚀",
        });
      } catch (ex) {
        console.error(ex);
        Notify.create({
          type: "negative",
          message: "Erro ao criar legendas: " + ex.message,
        });
      } finally {
        Loading.hide();
      }
    },
    toggleDarkMode(value) {
      Dark.set(value);
    },
  },
};
</script>
