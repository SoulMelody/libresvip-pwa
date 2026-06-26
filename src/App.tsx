import {
  Alert,
  AppBar,
  Avatar,
  Backdrop,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  ArrowClockwise20Regular,
  ArrowDownload20Regular,
  DocumentRegular,
  FolderOpen20Regular,
  Info20Regular,
  Play20Filled,
  Tag20Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
} from "@fluentui/react-icons";
import Form from "@rjsf/mui";
import type { FieldTemplateProps, RJSFSchema, RegistryWidgetsType, WidgetProps } from "@rjsf/utils";
import { customizeValidator } from "@rjsf/validator-ajv8";
import localizer from "ajv-i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { createAppTheme } from "./Theme";
import { formatErrorMessage } from "./conversion/error";
import { conversionClient, useAppStore } from "./store/appStore";
import type {
  BrowserConversionTask,
  ConversionEvent,
  JsonObject,
  PluginInfosResponse,
  PluginMetadata,
} from "./conversion/types";
import {
  createBrowserConversionTasks,
  normalizeDroppedFiles,
  pickFiles,
  triggerDownload,
} from "./platform/files";

type PluginAnchorState = {
  anchorPosition: {
    top: number;
    left: number;
  };
  plugin: PluginMetadata;
} | null;

const steps = ["converter.import_projects", "converter.export_config", "converter.options", "converter.export_files"];
const LARGE_FILE_WARNING_BYTES = 50 * 1024 * 1024;

export default function App() {
  const { t, i18n } = useTranslation();
  const {
    actualTheme,
    appVersion,
    initError,
    initialized,
    initializing,
    language,
    setActualTheme,
    setLanguage,
    initializeRuntime,
  } = useAppStore();
  const [plugins, setPlugins] = useState<PluginInfosResponse>({
    input: {},
    output: {},
    middleware: {},
  });
  const [pluginError, setPluginError] = useState<string | null>(null);
  const [pluginsLoading, setPluginsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [optionTab, setOptionTab] = useState(0);
  const [inputFormat, setInputFormat] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [tasks, setTasks] = useState<BrowserConversionTask[]>([]);
  const [inputOptions, setInputOptions] = useState<JsonObject>({});
  const [outputOptions, setOutputOptions] = useState<JsonObject>({});
  const [middlewareOptions, setMiddlewareOptions] = useState<Record<string, JsonObject>>({});
  const [selectedMiddlewares, setSelectedMiddlewares] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [finishedCount, setFinishedCount] = useState(0);
  const [pluginAnchor, setPluginAnchor] = useState<PluginAnchorState>(null);
  const dropDepth = useRef(0);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  useEffect(() => {
    void initializeRuntime();
  }, [initializeRuntime]);

  useEffect(() => {
    if (!initialized || initError) {
      return;
    }
    let cancelled = false;
    setPluginsLoading(true);
    setPluginError(null);
    conversionClient
      .pluginInfos(language)
      .then((pluginInfos) => {
        if (cancelled) {
          return;
        }
        setPlugins(pluginInfos);
        const firstInput = Object.keys(pluginInfos.input)[0] ?? "";
        const firstOutput = Object.keys(pluginInfos.output)[0] ?? "";
        setInputFormat((current) => current || firstInput);
        setOutputFormat((current) => current || firstOutput);
      })
      .catch((error) => {
        if (!cancelled) {
          setPluginError(formatErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPluginsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialized, initError, language]);

  useEffect(() => {
    setTasks((currentTasks) =>
      inputFormat ? currentTasks.filter((task) => task.inputFormat === inputFormat) : currentTasks,
    );
    setInputOptions((plugins.input[inputFormat]?.defaultValue ?? {}) as JsonObject);
  }, [inputFormat, plugins.input]);

  useEffect(() => {
    setOutputOptions((plugins.output[outputFormat]?.defaultValue ?? {}) as JsonObject);
  }, [outputFormat, plugins.output]);

  const theme = useMemo(() => createAppTheme(actualTheme), [actualTheme]);
  const inputPluginList = Object.values(plugins.input);
  const outputPluginList = Object.values(plugins.output);
  const middlewareList = Object.values(plugins.middleware);
  const canConvert =
    initialized &&
    !initError &&
    !pluginError &&
    tasks.length > 0 &&
    inputFormat !== "" &&
    outputFormat !== "" &&
    !converting;
  const expectedFinishCount = tasks.length;
  const validator = useMemo(
    () =>
      customizeValidator(
        {},
        i18n.language === "zh_CN" ? localizer.zh : localizer.en,
      ),
    [i18n.language],
  );

  const handleFiles = (files: File[]) => {
    const result = createBrowserConversionTasks(files, plugins.input, inputFormat || null);
    const totalBytes = result.tasks.reduce((sum, task) => sum + task.file.size, 0);
    const largeFile = result.tasks.find((task) => task.file.size >= LARGE_FILE_WARNING_BYTES);
    if (largeFile || totalBytes >= LARGE_FILE_WARNING_BYTES) {
      const fileName = largeFile?.file.name;
      const sizeInMb = Math.ceil((largeFile?.file.size ?? totalBytes) / (1024 * 1024));
      setSizeWarning(
        fileName
          ? t("converter.large_file_warning_single", { name: fileName, sizeInMb })
          : t("converter.large_file_warning_total", { sizeInMb }),
      );
    } else {
      setSizeWarning(null);
    }
    if (result.rejections.length > 0) {
      setMessage(
        result.rejections
          .map((rejection) => t("converter.unsupported_file", { name: rejection.file.name }))
          .join("\n"),
      );
    }
    if (result.tasks.length > 0) {
      setTasks((current) => [...current, ...result.tasks]);
      setInputFormat(result.tasks[result.tasks.length - 1].inputFormat);
      setActiveStep(0);
    }
  };

  const handlePickFiles = async () => {
    const accept = inputPluginList
      .flatMap((plugin) => plugin.suffixes)
      .map((suffix) => `.${suffix}`)
      .join(",");
    handleFiles(await pickFiles(accept));
  };

  const handleDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    dropDepth.current = 0;
    const normalized = await normalizeDroppedFiles(event.dataTransfer.items);
    if (normalized.rejections.length > 0) {
      setMessage(t("converter.directories_not_supported"));
    }
    handleFiles(normalized.files);
  };

  const updateTask = (taskId: string, patch: Partial<BrowserConversionTask>) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
  };

  const handleConversionEvent = (event: ConversionEvent) => {
    switch (event.type) {
      case "task-started":
        updateTask(event.taskId, { running: true, success: null, error: null, warning: null });
        break;
      case "task-warning":
        updateTask(event.taskId, { warning: event.warning });
        break;
      case "task-completed":
        updateTask(event.taskId, {
          running: false,
          success: true,
          output: {
            ...event.output,
            url: URL.createObjectURL(new Blob([event.output.data], { type: event.output.mime })),
          },
          warning: event.output.warnings.join("\n") || null,
        });
        setFinishedCount((count) => count + 1);
        break;
      case "task-failed":
        updateTask(event.taskId, {
          running: false,
          success: false,
          error: event.error.message,
        });
        setFinishedCount((count) => count + 1);
        break;
    }
  };

  const startConversion = async () => {
    setConverting(true);
    setFinishedCount(0);
    setActiveStep(3);
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        running: false,
        success: null,
        error: null,
        warning: null,
        output: undefined,
      })),
    );
    try {
      await conversionClient.convert(
        {
          mode: "direct",
          inputFormat,
          outputFormat,
          inputOptions,
          outputOptions,
          middlewareOptions: Object.fromEntries(
            Object.entries(middlewareOptions).filter(([id]) => selectedMiddlewares.includes(id)),
          ),
          tasks: tasks.map((task) => ({
            id: task.id,
            name: task.baseName,
            inputFormat: task.inputFormat,
            file: task.file,
          })),
          language,
        },
        handleConversionEvent,
      );
    } catch (error) {
      setMessage(formatErrorMessage(error));
    } finally {
      setConverting(false);
    }
  };

  const activePlugin = pluginAnchor?.plugin;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar variant="dense" sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              LibreSVIP
            </Typography>
            <Chip size="small" label={appVersion || t("runtime.unknown_version")} />
            <Button
              size="small"
              onClick={() => setLanguage(language === "zh_CN" ? "en_US" : "zh_CN")}
            >
              {language === "zh_CN" ? "English" : "中文"}
            </Button>
            <IconButton
              aria-label={t("app.toggle_theme")}
              onClick={() => setActualTheme(actualTheme === "dark" ? "light" : "dark")}
            >
              {actualTheme === "dark" ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {t("app.title")}
              </Typography>
              <Typography color="text.secondary">{t("app.subtitle")}</Typography>
            </Box>

            {initializing && (
              <Alert icon={<CircularProgress size={18} />} severity="info">
                {t("runtime.initializing")}
              </Alert>
            )}
            {initError && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<ArrowClockwise20Regular />}
                    onClick={() => void initializeRuntime(true)}
                  >
                    {t("runtime.retry")}
                  </Button>
                }
              >
                {initError.message}
              </Alert>
            )}
            {pluginError && <Alert severity="error">{pluginError}</Alert>}
            {message && (
              <Alert severity="warning" onClose={() => setMessage(null)} sx={{ whiteSpace: "pre-wrap" }}>
                {message}
              </Alert>
            )}
            {sizeWarning && (
              <Alert severity="warning" onClose={() => setSizeWarning(null)}>
                {sizeWarning}
              </Alert>
            )}
            {!initError && initialized && !pluginError && (
              <Alert severity="success">
                {t("runtime.ready", { version: appVersion || t("runtime.unknown_version") })}
              </Alert>
            )}

            <Paper sx={{ p: 2 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((step) => (
                  <Step key={step}>
                    <StepLabel>{t(step)}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {renderStep()}
          </Stack>
        </Container>

        <Popover
          open={Boolean(pluginAnchor)}
          anchorReference="anchorPosition"
          anchorPosition={pluginAnchor?.anchorPosition}
          onClose={() => setPluginAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          {activePlugin && (
            <Box sx={{ p: 2, maxWidth: 420 }}>
              <Stack direction="row" spacing={2}>
                {activePlugin.iconBase64 && (
                  <Avatar
                    src={`data:image/png;base64,${activePlugin.iconBase64}`}
                    variant="square"
                    sx={{ width: 72, height: 72 }}
                  />
                )}
                <Box>
                  <Typography variant="h6">{activePlugin.name || activePlugin.identifier}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
                    <Chip size="small" icon={<Tag20Regular />} label={activePlugin.version} />
                    {activePlugin.fileFormat && (
                      <Chip
                        size="small"
                        icon={<DocumentRegular />}
                        label={`${activePlugin.fileFormat} (${activePlugin.suffixes.map((suffix) => `*.${suffix}`).join(", ")})`}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
              {activePlugin.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2">{activePlugin.description}</Typography>
                </>
              )}
            </Box>
          )}
        </Popover>
      </Box>
    </ThemeProvider>
  );

  function renderStep() {
    switch (activeStep) {
          case 0:
            return (
              <Paper sx={{ p: 2 }}>
                <Stack spacing={2}>
                <FormatSelect
                  label={t("converter.input_format")}
                  value={inputFormat}
                  plugins={inputPluginList}
                  loading={pluginsLoading}
                  onChange={setInputFormat}
                />
                <Box
                  onDragEnter={(event) => {
                    event.preventDefault();
                    dropDepth.current += 1;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => {
                    dropDepth.current = Math.max(0, dropDepth.current - 1);
                  }}
                  onDrop={handleDrop}
                  onClick={() => void handlePickFiles()}
                  sx={{
                    p: 4,
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 1,
                    minHeight: 280,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    cursor: "pointer",
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <FolderOpen20Regular fontSize={44} />
                  <Typography variant="h6">{t("converter.dropzone_placeholder")}</Typography>
                  <Button variant="contained" disabled={!initialized || Boolean(initError)}>
                    {t("converter.choose_files")}
                  </Button>
                </Box>
                <TaskList tasks={tasks} onClear={() => setTasks([])} />
                <NavButtons
                  canNext={tasks.length > 0 && inputFormat !== ""}
                  canBack={false}
                  onBack={() => undefined}
                  onNext={() => setActiveStep(1)}
                />
              </Stack>
            </Paper>
          );
      case 1:
        return (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormatSelect
                  label={t("converter.output_format")}
                  value={outputFormat}
                  plugins={outputPluginList}
                  loading={pluginsLoading}
                  onChange={setOutputFormat}
                />
                <Alert severity="info" sx={{ flex: 1 }}>
                  {t("runtime.platform_limits_body")}
                </Alert>
              </Stack>
              <NavButtons
                canNext={outputFormat !== ""}
                canBack
                onBack={() => setActiveStep(0)}
                onNext={() => setActiveStep(2)}
              />
            </Stack>
          </Paper>
        );
      case 2:
        return (
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={optionTab}
              onChange={(_event, value: number) => setOptionTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab label={t("converter.input_options")} />
              <Tab label={t("converter.output_options")} />
              <Tab label={t("converter.middleware_options")} />
            </Tabs>
            <Divider sx={{ mb: 2 }} />
            {optionTab === 0 && (
              <SchemaForm
                schema={plugins.input[inputFormat]?.jsonSchema}
                uiSchema={plugins.input[inputFormat]?.uiSchema}
                formData={inputOptions}
                validator={validator}
                onChange={setInputOptions}
              />
            )}
            {optionTab === 1 && (
              <SchemaForm
                schema={plugins.output[outputFormat]?.jsonSchema}
                uiSchema={plugins.output[outputFormat]?.uiSchema}
                formData={outputOptions}
                validator={validator}
                onChange={setOutputOptions}
              />
            )}
            {optionTab === 2 && (
              <Stack spacing={2}>
                {middlewareList.length === 0 && (
                  <Typography color="text.secondary">{t("converter.no_middlewares")}</Typography>
                )}
                {middlewareList.map((plugin) => (
                  <Box key={plugin.identifier}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedMiddlewares.includes(plugin.identifier)}
                          onChange={(event) => {
                            setSelectedMiddlewares((current) =>
                              event.target.checked
                                ? [...current, plugin.identifier]
                                : current.filter((id) => id !== plugin.identifier),
                            );
                          }}
                        />
                      }
                      label={plugin.name || plugin.identifier}
                    />
                    {selectedMiddlewares.includes(plugin.identifier) && (
                      <SchemaForm
                        schema={plugin.jsonSchema}
                        uiSchema={plugin.uiSchema}
                        formData={middlewareOptions[plugin.identifier] ?? plugin.defaultValue}
                        validator={validator}
                        onChange={(formData) =>
                          setMiddlewareOptions((current) => ({
                            ...current,
                            [plugin.identifier]: formData,
                          }))
                        }
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
            <NavButtons
              canNext={canConvert}
              canBack
              nextLabel={t("nav.start")}
              nextIcon={<Play20Filled />}
              onBack={() => setActiveStep(1)}
              onNext={() => void startConversion()}
            />
          </Paper>
        );
          case 3:
        return (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              {converting && (
                <Alert icon={<CircularProgress size={18} />} severity="info">
                  {finishedCount} / {expectedFinishCount}
                </Alert>
              )}
              <TaskList tasks={tasks} showDownload />
              <Stack direction="row" spacing={1}>
                <Button startIcon={<ArrowClockwise20Regular />} onClick={() => setActiveStep(0)}>
                  {t("converter.reset")}
                </Button>
              </Stack>
            </Stack>
            <Backdrop
              open={converting}
              sx={{ color: "#fff", zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1 }}
            >
              <Stack spacing={2} sx={{ alignItems: "center" }}>
                <CircularProgress color="inherit" />
                <Typography>
                  {finishedCount} / {expectedFinishCount}
                </Typography>
              </Stack>
            </Backdrop>
          </Paper>
        );
      default:
        return null;
    }
  }

  function FormatSelect(props: {
    label: string;
    value: string;
    plugins: PluginMetadata[];
    loading: boolean;
    onChange: (value: string) => void;
  }) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>{props.label}</InputLabel>
          <Select
            label={props.label}
            value={props.value}
            disabled={props.loading}
            onChange={(event: SelectChangeEvent) => props.onChange(event.target.value)}
          >
            {props.plugins.map((plugin) => (
              <MenuItem key={plugin.identifier} value={plugin.identifier}>
                {plugin.fileFormat || plugin.name || plugin.identifier}{" "}
                {plugin.suffixes.length > 0 &&
                  `(${plugin.suffixes.map((suffix) => `*.${suffix}`).join(", ")})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {props.value && (
          <Tooltip title={t("converter.view_plugin_info")}>
            <IconButton
              onClick={(event) => {
                const plugin = props.plugins.find((item) => item.identifier === props.value);
                if (plugin) {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setPluginAnchor({
                    anchorPosition: {
                      top: rect.bottom,
                      left: rect.left + rect.width / 2,
                    },
                    plugin,
                  });
                }
              }}
            >
              <Info20Regular />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    );
  }

  function NavButtons(props: {
    canBack: boolean;
    canNext: boolean;
    nextLabel?: string;
    nextIcon?: React.ReactNode;
    onBack: () => void;
    onNext: () => void;
  }) {
    return (
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {props.canBack && <Button onClick={props.onBack}>{t("nav.back")}</Button>}
        <Button
          variant="contained"
          endIcon={props.nextIcon ?? <Play20Filled />}
          disabled={!props.canNext}
          onClick={props.onNext}
        >
          {props.nextLabel ?? t("nav.next")}
        </Button>
      </Stack>
    );
  }

  function TaskList(props: {
    tasks: BrowserConversionTask[];
    showDownload?: boolean;
    onClear?: () => void;
  }) {
    if (props.tasks.length === 0) {
      return <Alert severity="info">{t("converter.no_tasks")}</Alert>;
    }

    return (
      <Stack spacing={1}>
        {props.tasks.map((task) => (
          <Paper
            key={task.id}
            variant="outlined"
            sx={{ p: 1.5, display: "flex", gap: 1.5, alignItems: "center" }}
          >
            <DocumentRegular />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap>{task.baseName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {props.showDownload ? outputFormat : task.inputFormat}
                {task.running && ` · ${t("converter.running")}`}
                {task.success === true && ` · ${t("converter.success")}`}
                {task.success === false && ` · ${t("converter.failed")}`}
              </Typography>
              {task.warning && (
                <Typography component="span" variant="caption" color="warning.main" sx={{ display: "block" }}>
                  {task.warning}
                </Typography>
              )}
              {task.error && (
                <Typography component="span" variant="caption" color="error.main" sx={{ display: "block" }}>
                  {task.error}
                </Typography>
              )}
            </Box>
            {task.running && <CircularProgress size={20} />}
            {props.showDownload && task.output && (
              <Button
                size="small"
                startIcon={<ArrowDownload20Regular />}
                onClick={() => triggerDownload(task.output?.data ?? new ArrayBuffer(0), task.output?.fileName ?? "output.bin")}
              >
                {t("converter.download")}
              </Button>
            )}
          </Paper>
        ))}
        {props.onClear && (
          <Box>
            <Button size="small" onClick={props.onClear}>
              {t("converter.clear_tasks")}
            </Button>
          </Box>
        )}
      </Stack>
    );
  }

  function SchemaForm(props: {
    schema?: JsonObject;
    uiSchema?: JsonObject;
    formData: JsonObject;
    validator: ReturnType<typeof customizeValidator>;
    onChange: (formData: JsonObject) => void;
  }) {
    if (!props.schema || Object.keys(props.schema).length === 0) {
      return <Typography color="text.secondary">{t("converter.no_options")}</Typography>;
    }
    return (
      <Form
        schema={props.schema as RJSFSchema}
        uiSchema={props.uiSchema}
        formData={props.formData}
        validator={props.validator}
        templates={{ FieldTemplate: CompactFieldTemplate }}
        widgets={widgets}
        liveValidate
        onChange={(event) => props.onChange((event.formData ?? {}) as JsonObject)}
      />
    );
  }
}

function CompactFieldTemplate(props: FieldTemplateProps) {
  const { children, description, errors, help, hidden } = props;
  if (hidden) {
    return <Box sx={{ display: "none" }}>{children}</Box>;
  }
  return (
    <FormControl fullWidth error={(props.rawErrors?.length ?? 0) > 0} sx={{ my: 1 }}>
      {children}
      {description}
      {errors}
      {help}
    </FormControl>
  );
}

const widgets: RegistryWidgetsType = {
  CheckboxWidget(props: WidgetProps) {
    return (
      <FormControlLabel
        control={
          <Switch
            id={props.id}
            name={props.id}
            checked={Boolean(props.value)}
            onChange={() => props.onChange(!props.value)}
          />
        }
        label={props.label}
      />
    );
  },
};
