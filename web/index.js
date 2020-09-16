Vue.component('poison-item', {
  template: `
    <li>
        {{id}} - {{path}} {{type}}
        <button v-on:click="$emit('deletepoison', id)">delete</button>
    </li>
    `,
  props: ['id', 'path', 'type']
});

Vue.component('poison-item-table', {
  template:
    `
    <tr>
      <th scope="row">{{id}}</th>
      <td>{{expiredate}}</td>
      <td>{{path}}</td>
      <td>{{type}}</td>
      <td><button v-on:click="$emit('deletepoison', id)">delete</button></td>
    </tr>    
    `,
  props: ['id', 'expiredate', 'path', 'type']
});

Vue.component('add-poison-item', {
  data: () => {
    return {
      api: '/**',
      probability: 100,
      duration: 10000,
      type: 'latency',
      latency: undefined,
      delay: undefined,
      chunk: undefined,
      bandwidthdelay: undefined,
      code: undefined,
      contenttype: undefined,
      body: undefined
    };
  },
  template: `
    <form v-on:submit.prevent="$emit('addpoison', {api, duration, probability, poison: {type, latency, delay, chunk, bandwidthdelay, code, contenttype, body} })">
      <div id="alertPlaceHolder"></div>
      <fieldset>
          <div class="form-group">
              <label>Path:</label>
              <input name="api" v-model="api"/>
              <small class="form-text text-muted">Specify path such as /admin/kyc/**. For the exact path matching syntax take a look at <a href="https://www.npmjs.com/package/path-to-regexp">this</a> documentation.</small>
          </div>

          <div class="form-group">
              <label>Duration:</label>
              <input name="duration" v-model="duration" type="number" placeholder="60000"/>
              <small class="form-text text-muted">Specify duration for the given poison in millis.</small>
          </div>

          <div class="form-group">
            <label>Probability:</label>
            <input name="probability" v-model="probability" type="number" placeholder="100"/>
            <small class="form-text text-muted">Specify poison probability in the range of [0-100].</small>
          </div>

          <div class="form-group">
              <label>Type:</label>
              <select name="type" v-model="type">
                  <option value="latency">Latency</option>
                  <option value="abort">Abort</option>
                  <option value="bandwidth">Bandwidth</option>
                  <option value="response">Response</option>
              </select>
          </div>

          <div class="form-group" v-if="type === 'latency'">
              <p v-if="type === 'latency'">
              Infects the HTTP flow injecting a latency jitter in the response. 
              </p>
              <label>Latency</label>
              <input type="number" v-model="latency" name="latency" placeholder="1000"/>
              <small class="form-text text-muted">Specify latency in milliseconds.</small>
          </div>

          <div class="form-group" v-if="type === 'abort'">
              <p v-if="type === 'abort'">
              Infects the HTTP flow, aborting the TCP connection, operating only at TCP level without sending any specific HTTP application level data. 
              </p>
              <label>Delay</label>
              <input type="number" v-model="delay" name="delay" placeholder="0"/>
              <small class="form-text text-muted">Specify delay in milliseconds.</small>
          </div>

          <div class="form-group" v-if="type === 'bandwidth'">
              <p v-if="type === 'bandwidth'">
              Infects the HTTP flow, restricting the amount of packets sent over the network in a specific threshold time frame.
              </p>
              <label>Chunk</label>
              <input type="number" v-model="chunk" name="chunk" placeholder="1"/>
              <small class="form-text text-muted">Packet chunk size in bytes.</small>

              <label>Delay</label>
              <input type="number" v-model="bandwidthdelay" name="delay" placeholder="100"/>
              <small class="form-text text-muted">Data chunk delay time frame in milliseconds.</small>
          </div>

          <div class="form-group" v-if="type === 'response'">
              <p v-if="type === 'response'">
              Infects the HTTP flow, intercepting the request before sending it to the target server and returning a custom error.
              </p>
              <label>Code</label>
              <input type="number" v-model="code" name="code" placeholder="500" />
              <small class="form-text text-muted">HTTP response status code</small>

              <label>Content Type</label>
              <input type="text" v-model="contenttype" name="contenttype" placeholder="application/json"/>
              <small class="form-text text-muted">HTTP response content type</small>

              <label>Content</label>
              <textarea v-model="body" name="body" />
              <small class="form-text text-muted">Actual HTTP response to send</small>
          </div>
      </fieldset>
      <input id="addPoison" class="btn btn-primary" type="submit" value="Add"/>
      <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
    </form>
    `
})

var app = new Vue({
  el: '#app',
  data: {
    poisons: []
  },
  beforeMount: function () {
    this.reloadPoisons();
  },
  methods: {
    deletePoison: function (id) {
      console.log(`Deleting ${id} `);
      fetch(`/poisons/${id}`, { method: "DELETE" })
        .then(() => {
          console.log(`Deleted ${id} `);
          this.reloadPoisons();
        });
    },
    reloadPoisons: function () {
      fetch('/poisons')
        .then((data) => data.json())
        .then((json) => this.poisons = json)
        .catch((err) => console.log('Ooops', err));
    },
    addPoison: function (poison) {
      fetch('/poisons', {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(poison, null, 2)
      })
      .then(response => {
        this.reloadPoisons();
        if (response.ok) {
          $("#exampleModal").modal('toggle');          
        } else {
          $('#alertPlaceHolder').append(
            `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
              <strong>Could not save poison:</strong>
              Perhaps a poison on the same API already exists?
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            `
          );
        }
      })
      .catch(err => console.log('Ooops'));
    }
  }
});