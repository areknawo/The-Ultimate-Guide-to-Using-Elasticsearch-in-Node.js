import {
  AppBar,
  Box,
  Container,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
} from "@mui/material";
import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Search, Delete } from "@mui/icons-material";
import axios from "axios";
import faker from "@faker-js/faker";
import { useEffect } from "react";

const api = {
  async addPost(post) {
    const response = await axios.post("/api/create-post", post);

    return response.data;
  },
  async removePost(id) {
    const response = await axios.delete(`/api/remove-post?id=${id}`);

    return response.data;
  },
  async search(query) {
    const response = await axios.get(`/api/search?query=${query}`);

    return response.data;
  },
  async getAllPosts() {
    const response = await axios.get("/api/posts");

    return response.data;
  },
  async isAuthenticated() {
    const response = await axios.get("/api/is-authenticated");

    return response.data;
  },
};
const columns = [
  {
    field: "title",
    headerName: "Title",
    flex: 2,
    minWidth: 150,
  },
  {
    field: "author",
    headerName: "Author",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "content",
    headerName: "Content",
    flex: 1,
    minWidth: 150,
  },
];
const TopMenu = (props) => {
  return (
    <Box sx={{ flexGrow: 1, mb: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <div style={{ flex: 1 }}></div>
          {props.username ? (
            <>
              <span>{props.username}</span>
              <Button color="inherit" href="/api/logout">
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" href="/api/login">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};
const EditMenu = (props) => {
  return (
    <div>
      <Button
        startIcon={<Add />}
        variant="contained"
        sx={{ my: 1, mr: 1 }}
        onClick={props.addPost}
        disabled={!props.username}
      >
        Add
      </Button>
      <Button
        startIcon={<Delete />}
        variant="contained"
        disabled={!props.username || !props.selection.length}
        sx={{ my: 1, mr: 1 }}
        onClick={() => props.removePosts(props.selection)}
      >
        Remove
      </Button>
    </div>
  );
};
const App = () => {
  const [posts, setPosts] = useState([]);
  const [selection, setSelection] = useState([]);
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("");
  const addPost = async () => {
    const post = {
      title: faker.lorem.lines(1),
      content: faker.lorem.paragraphs(3),
      author: faker.name.findName(),
    };
    const response = await api.addPost(post);
    setPosts([...posts, { ...post, id: response._id }]);
  };
  const removePosts = async (removedIds) => {
    setPosts(posts.filter((post) => !removedIds.includes(post.id)));
    await Promise.all(removedIds.map((id) => api.removePost(id)));
  };
  const loadUser = async () => {
    const response = await api.isAuthenticated();

    console.log(response);
    if (response.authenticated) {
      setUsername(response.username);
      return true;
    }

    return false;
  };
  const search = async () => {
    const response = await api.search(query);

    setSelection(
      response.hits.hits.map((hit) => {
        return hit._id;
      })
    );
  };

  useEffect(() => {
    loadUser().then((authenticated) => {
      if (authenticated) {
        api.getAllPosts().then((response) => {
          setPosts(
            response.hits.hits.map((hit) => ({
              id: hit._id,
              ...hit._source,
            }))
          );
        });
      }
    });
  }, []);

  return (
    <>
      <TopMenu username={username} />
      <Container maxWidth="md">
        <TextField
          placeholder="Search"
          fullWidth
          value={query}
          onInput={(event) => setQuery(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment sx={{ pr: 1.5 }} position="start">
                <IconButton onClick={search}>
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
        ></TextField>
        <EditMenu
          username={username}
          selection={selection}
          addPost={addPost}
          removePosts={removePosts}
        />
        <div style={{ width: "100%" }}>
          <DataGrid
            autoHeight
            rows={posts}
            columns={columns}
            pageSize={100}
            checkboxSelection
            onSelectionModelChange={(model) => setSelection(model)}
            selectionModel={selection}
          />
        </div>
      </Container>
    </>
  );
};

export default App;
